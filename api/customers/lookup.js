// =============================================================================
// Customer Lookup API - /api/customers/lookup
// =============================================================================
// Returns customer info + last shipping address for checkout autofill
// =============================================================================

import { supabase } from './../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get customer using maybeSingle to avoid errors
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, phone')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (customerError) {
      console.error('Customer lookup error:', customerError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get last order's shipping address and phone info
    const { data: lastOrder, error: orderError } = await supabase
      .from('orders')
      .select(`
        customer_phone,
        shipping_first_name,
        shipping_last_name,
        shipping_address,
        shipping_apartment,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        shipping_country_code
      `)
      .eq('customer_email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error('Order lookup error:', orderError);
    }

    // Extract phone country code from stored phone number
    // Phone is stored as +1234567890 format
    let phoneNumber = customer.phone || lastOrder?.customer_phone || '';
    let phoneCountry = 'US'; // Default
    
    if (phoneNumber) {
      // Common country codes mapping
      const countryCodes = {
        '+1': 'US',
        '+44': 'GB',
        '+351': 'PT',
        '+234': 'NG',
        '+220': 'GM',
      };
      
      for (const [code, country] of Object.entries(countryCodes)) {
        if (phoneNumber.startsWith(code)) {
          phoneCountry = country;
          phoneNumber = phoneNumber.substring(code.length);
          break;
        }
      }
    }

    // Build response
    const response = {
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name || lastOrder?.shipping_first_name,
      last_name: customer.last_name || lastOrder?.shipping_last_name,
      phone: phoneNumber,
      phone_country: phoneCountry,
    };

    // Add last address if exists
    if (lastOrder) {
      response.last_address = {
        address: lastOrder.shipping_address,
        apartment: lastOrder.shipping_apartment,
        city: lastOrder.shipping_city,
        state: lastOrder.shipping_state,
        postal_code: lastOrder.shipping_postal_code,
        country: lastOrder.shipping_country,
        country_code: lastOrder.shipping_country_code,
      };
    }

    return res.status(200).json(response);

  } catch (err) {
    console.error('Customer lookup error:', err);
    return res.status(500).json({ error: 'Failed to lookup customer' });
  }
}