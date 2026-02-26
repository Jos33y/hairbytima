// ==========================================================================
// API: Verify Code - /api/orders/verify-code.js
// ==========================================================================
// Verifies the 6-digit code and returns user's orders
// ==========================================================================

import { supabase } from './../_lib/supabase.js';

const MAX_ATTEMPTS = 5;

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = code.toString().trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      return res.status(400).json({ error: 'Invalid code format' });
    }

    // Get verification record (matching purpose)
    const { data: verification, error: verifyError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('purpose', 'order_lookup')
      .eq('verified', false)
      .single();

    if (verifyError || !verification) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      // Delete expired code
      await supabase
        .from('verification_codes')
        .delete()
        .eq('id', verification.id);
      
      return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
    }

    // Check attempts
    if (verification.attempts >= MAX_ATTEMPTS) {
      // Delete after too many attempts
      await supabase
        .from('verification_codes')
        .delete()
        .eq('id', verification.id);
      
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
    }

    // Verify code
    if (verification.code !== normalizedCode) {
      // Increment attempts
      await supabase
        .from('verification_codes')
        .update({ attempts: verification.attempts + 1 })
        .eq('id', verification.id);
      
      const remaining = MAX_ATTEMPTS - verification.attempts - 1;
      return res.status(400).json({ 
        error: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
      });
    }

    // Code is valid - mark as verified then delete
    await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', verification.id);
    
    await supabase
      .from('verification_codes')
      .delete()
      .eq('id', verification.id);

    // Fetch user's orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        status,
        payment_status,
        payment_proof_url,
        subtotal,
        discount,
        shipping_cost,
        total,
        currency,
        shipping_first_name,
        shipping_last_name,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_country,
        tracking_number,
        carrier
      `)
      .eq('customer_email', normalizedEmail)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        return {
          ...order,
          items: itemsError ? [] : items,
        };
      })
    );

    // Get unique currencies from orders (excluding USD)
    const currencies = [...new Set(orders.map(o => o.currency).filter(c => c && c !== 'USD'))];
    
    // Fetch exchange rates for those currencies
    let exchangeRates = { USD: 1 };
    if (currencies.length > 0) {
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('to_currency, rate')
        .eq('from_currency', 'USD')
        .eq('is_active', true)
        .in('to_currency', currencies);
      
      if (rateData) {
        rateData.forEach(r => {
          exchangeRates[r.to_currency] = parseFloat(r.rate);
        });
      }
    }

    return res.status(200).json({
      success: true,
      orders: ordersWithItems,
      exchangeRates,
    });

  } catch (error) {
    console.error('Verify code error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}