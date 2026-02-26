// ==========================================================================
// API: Track Order - /api/orders/track.js
// ==========================================================================
// Looks up a single order by order number and email (no verification needed)
// ==========================================================================

import { supabase } from './../_lib/supabase.js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderNumber, email } = req.body;

    // Validate input
    if (!orderNumber || !email) {
      return res.status(400).json({ error: 'Order number and email are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedOrderNumber = orderNumber.toUpperCase().trim();

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        status,
        payment_status,
        payment_method,
        payment_proof_url,
        payment_proof_uploaded_at,
        rejection_reason,
        subtotal,
        discount,
        coupon_code,
        shipping_cost,
        total,
        currency,
        customer_email,
        customer_phone,
        shipping_first_name,
        shipping_last_name,
        shipping_address,
        shipping_apartment,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        tracking_number,
        carrier,
        courier_phone,
        tracking_url,
        shipped_at,
        delivered_at
      `)
      .eq('order_number', normalizedOrderNumber)
      .eq('customer_email', normalizedEmail)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ 
        error: 'Order not found. Please check your order number and email.' 
      });
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
    }

    // Fetch order timeline
    const { data: timeline, error: timelineError } = await supabase
      .from('order_timeline')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    if (timelineError) {
      console.error('Error fetching timeline:', timelineError);
    }

    // Build status timeline for display
    const statusTimeline = buildStatusTimeline(order, timeline || []);

    // Get exchange rate for currency conversion (amounts stored in USD)
    let exchangeRate = 1;
    if (order.currency && order.currency !== 'USD') {
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'USD')
        .eq('to_currency', order.currency)
        .eq('is_active', true)
        .single();
      
      if (rateData?.rate) {
        exchangeRate = parseFloat(rateData.rate);
      }
    }

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items: items || [],
        timeline: statusTimeline,
      },
      exchangeRate,
    });

  } catch (error) {
    console.error('Track order error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

/**
 * Build a complete status timeline for display
 */
function buildStatusTimeline(order, events) {
  const steps = [
    { 
      status: 'Order Placed', 
      key: 'placed',
      completed: true, 
      date: formatDate(order.created_at) 
    },
    { 
      status: 'Payment Confirmed', 
      key: 'payment',
      completed: order.payment_status === 'paid' || order.payment_status === 'verified',
      date: getEventDate(events, 'payment_verified') || getEventDate(events, 'payment_confirmed') || 'Pending'
    },
    { 
      status: 'Processing', 
      key: 'processing',
      completed: ['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status),
      date: getEventDate(events, 'processing_started') || (order.status !== 'pending' ? 'In Progress' : 'Pending')
    },
    { 
      status: 'Shipped', 
      key: 'shipped',
      completed: ['shipped', 'out_for_delivery', 'delivered'].includes(order.status),
      date: order.shipped_at ? formatDate(order.shipped_at) : 'Pending',
      trackingNumber: order.tracking_number,
      carrier: order.carrier,
    },
    { 
      status: 'Delivered', 
      key: 'delivered',
      completed: order.status === 'delivered',
      date: order.delivered_at ? formatDate(order.delivered_at) : 'Pending'
    },
  ];

  return steps;
}

function getEventDate(events, action) {
  const event = events.find(e => e.action === action);
  return event ? formatDate(event.created_at) : null;
}

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}