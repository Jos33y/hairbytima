// ==========================================================================
// API: Refresh Orders - /api/orders/refresh
// ==========================================================================
// Re-fetches orders for a verified session (no code required)
// Used when user wants to see latest order status updates
// ==========================================================================

import { supabase } from './../_lib/supabase.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

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
    console.error('Refresh orders error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}