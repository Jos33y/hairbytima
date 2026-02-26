// =============================================================================
// Public Analytics API - /api/analytics
// =============================================================================
// POST: Track analytics events (page views, add to cart, checkout, etc.)
// =============================================================================

import { supabase } from './../_lib/supabase.js';

// All valid event types
const VALID_EVENTS = [
  // Page views
  'page_view',
  
  // Product interactions
  'product_view',
  'product_click',
  
  // Cart actions
  'add_to_cart',
  'remove_from_cart',
  'update_cart_quantity',
  'view_cart',
  
  // Wishlist actions
  'add_to_wishlist',
  'remove_from_wishlist',
  'share_wishlist',
  
  // Checkout funnel
  'checkout_start',
  'add_contact_info',
  'add_shipping_info',
  'select_payment_method',
  'upload_payment_proof',
  'checkout_complete',
  'purchase',
  
  // Coupon
  'apply_coupon',
  'remove_coupon',
  
  // Search
  'search',
  
  // Newsletter
  'newsletter_subscribe',
  
  // Contact
  'contact_form_submit',
  
  // Order tracking
  'track_order',
  'view_my_orders',
  
  // Errors
  'error',
];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      event_type,
      session_id,
      visitor_id,
      page_url,
      referrer,
      product_id,
      order_id,
      metadata,
      country,
      device_type,
    } = req.body;

    // Validate event type
    if (!event_type) {
      return res.status(400).json({ error: 'Missing event_type' });
    }

    // Allow any event type but log unknown ones
    if (!VALID_EVENTS.includes(event_type)) {
      console.warn(`Unknown analytics event type: ${event_type}`);
    }

    // Try to get country from request headers (Vercel provides this)
    const detectedCountry = country || 
      req.headers['x-vercel-ip-country'] || 
      req.headers['cf-ipcountry'] || 
      null;

    // Insert event
    const { error: insertError } = await supabase
      .from('analytics_events')
      .insert({
        event_type,
        session_id: session_id || null,
        visitor_id: visitor_id || null,
        page_url: page_url || null,
        referrer: referrer || null,
        product_id: product_id || null,
        order_id: order_id || null,
        metadata: metadata || {},
        country: detectedCountry,
        device_type: device_type || null,
      });

    if (insertError) {
      console.error('Analytics insert error:', insertError);
      // Don't fail the request for analytics errors
      return res.status(200).json({ success: true, tracked: false });
    }

    return res.status(200).json({ success: true, tracked: true });

  } catch (err) {
    console.error('Analytics error:', err);
    // Don't fail the request for analytics errors
    return res.status(200).json({ success: true, tracked: false });
  }
}