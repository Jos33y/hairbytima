// =============================================================================
// Admin Customers API - /api/admin/customers
// =============================================================================
// GET: List all customers with their orders and coupon usage
// PUT: Update customer (flag/unflag, add notes)
// =============================================================================

import { supabase } from '../../_lib/supabase.js';
import { verifyAuth } from '../../_lib/auth.js'; 

export default async function handler(req, res) {
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  // Check for single customer operations
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      if (id) {
        return getCustomer(req, res, id);
      }
      return getCustomers(req, res);
    case 'PUT':
      if (!id) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      return updateCustomer(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// =============================================================================
// GET all customers
// =============================================================================
async function getCustomers(req, res) {
  try {
    const {
      search,
      flagged,
      sort = 'total_spent',
      order = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Flagged filter
    if (flagged === 'true') {
      query = query.eq('is_flagged', true);
    } else if (flagged === 'false') {
      query = query.eq('is_flagged', false);
    }

    // Sorting
    const validSortFields = ['total_spent', 'total_orders', 'last_order_at', 'created_at', 'first_name'];
    const sortField = validSortFields.includes(sort) ? sort : 'total_spent';
    query = query.order(sortField, { ascending: order === 'asc', nullsFirst: false });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: customers, error: fetchError, count } = await query;

    if (fetchError) throw fetchError;

    // Now fetch orders for each customer to get detailed info
    const customerIds = customers.map(c => c.id);
    
    // Get orders for these customers (including location for most recent)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, customer_id, total, status, created_at, coupon_code, discount, shipping_city, shipping_country, payment_proof_url')
      .in('customer_id', customerIds)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Get coupon usage for these customers
    const customerEmails = customers.map(c => c.email);
    const { data: couponUsage, error: couponError } = await supabase
      .from('coupon_usage')
      .select('*, coupon:coupons(code)')
      .in('customer_email', customerEmails);

    if (couponError) throw couponError;

    // Combine data
    const enrichedCustomers = customers.map(customer => {
      const customerOrders = orders?.filter(o => o.customer_id === customer.id) || [];
      const customerCoupons = couponUsage?.filter(c => c.customer_email === customer.email) || [];
      
      const totalSaved = customerCoupons.reduce((sum, c) => sum + parseFloat(c.discount_amount || 0), 0);
      const avgOrderValue = customerOrders.length > 0 
        ? customerOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) / customerOrders.length 
        : 0;
      
      // Get location from most recent order
      const mostRecentOrder = customerOrders[0];

      return {
        id: customer.id,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email.split('@')[0],
        email: customer.email,
        phone: customer.phone || '',
        firstName: customer.first_name,
        lastName: customer.last_name,
        totalOrders: customer.total_orders || customerOrders.length,
        totalSpent: parseFloat(customer.total_spent) || customerOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0),
        averageOrderValue: avgOrderValue,
        lastOrderDate: customer.last_order_at || customerOrders[0]?.created_at || null,
        firstOrderDate: customerOrders.length > 0 ? customerOrders[customerOrders.length - 1].created_at : customer.created_at,
        createdAt: customer.created_at,
        isFlagged: customer.is_flagged,
        flagReason: customer.flag_reason,
        acceptsMarketing: customer.accepts_marketing,
        // Location from most recent order
        city: mostRecentOrder?.shipping_city || '',
        country: mostRecentOrder?.shipping_country || '',
        // Orders summary
        orders: customerOrders.map(o => ({
          id: o.order_number,
          orderId: o.id,
          total: parseFloat(o.total),
          status: o.status,
          hasPaymentProof: !!o.payment_proof_url,
          date: o.created_at,
          couponCode: o.coupon_code,
          discount: parseFloat(o.discount || 0),
        })),
        // Coupons used
        couponsUsed: customerCoupons.map(c => ({
          code: c.coupon?.code || 'Unknown',
          discount: parseFloat(c.discount_amount),
          orderId: c.order_id,
          usedAt: c.used_at,
        })),
        totalSaved,
      };
    });

    return res.status(200).json({
      success: true,
      customers: enrichedCustomers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (err) {
    console.error('Get customers error:', err);
    return res.status(500).json({ error: 'Failed to fetch customers', details: err.message });
  }
}

// =============================================================================
// GET single customer with full details
// =============================================================================
async function getCustomer(req, res, id) {
  try {
    // Get customer
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get all orders for this customer
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        subtotal,
        discount,
        shipping_cost,
        status,
        payment_status,
        payment_method,
        payment_proof_url,
        coupon_code,
        shipping_city,
        shipping_country,
        created_at
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Get order items count for each order
    const orderIds = orders?.map(o => o.id) || [];
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id, quantity')
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    // Get coupon usage
    const { data: couponUsage, error: couponError } = await supabase
      .from('coupon_usage')
      .select('*, coupon:coupons(code)')
      .eq('customer_email', customer.email)
      .order('used_at', { ascending: false });

    if (couponError) throw couponError;

    // Calculate order items count
    const itemCountByOrder = {};
    orderItems?.forEach(item => {
      itemCountByOrder[item.order_id] = (itemCountByOrder[item.order_id] || 0) + item.quantity;
    });

    // Build response
    const enrichedOrders = orders?.map(o => ({
      id: o.order_number,
      orderId: o.id,
      total: parseFloat(o.total),
      subtotal: parseFloat(o.subtotal),
      discount: parseFloat(o.discount || 0),
      shippingCost: parseFloat(o.shipping_cost || 0),
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      hasPaymentProof: !!o.payment_proof_url,
      couponCode: o.coupon_code,
      city: o.shipping_city,
      country: o.shipping_country,
      date: o.created_at,
      items: itemCountByOrder[o.id] || 0,
    })) || [];

    const totalSaved = couponUsage?.reduce((sum, c) => sum + parseFloat(c.discount_amount || 0), 0) || 0;
    const avgOrderValue = enrichedOrders.length > 0 
      ? enrichedOrders.reduce((sum, o) => sum + o.total, 0) / enrichedOrders.length 
      : 0;

    return res.status(200).json({
      success: true,
      customer: {
        id: customer.id,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email.split('@')[0],
        email: customer.email,
        phone: customer.phone || '',
        firstName: customer.first_name,
        lastName: customer.last_name,
        totalOrders: customer.total_orders || enrichedOrders.length,
        totalSpent: parseFloat(customer.total_spent) || enrichedOrders.reduce((sum, o) => sum + o.total, 0),
        averageOrderValue: avgOrderValue,
        lastOrderDate: customer.last_order_at || enrichedOrders[0]?.date || null,
        firstOrderDate: enrichedOrders.length > 0 ? enrichedOrders[enrichedOrders.length - 1].date : customer.created_at,
        createdAt: customer.created_at,
        isFlagged: customer.is_flagged,
        flagReason: customer.flag_reason,
        acceptsMarketing: customer.accepts_marketing,
        orders: enrichedOrders,
        couponsUsed: couponUsage?.map(c => ({
          code: c.coupon?.code || 'Unknown',
          discount: parseFloat(c.discount_amount),
          orderId: c.order_id,
          usedAt: c.used_at,
        })) || [],
        totalSaved,
        // Location from most recent order
        city: enrichedOrders[0]?.city || '',
        country: enrichedOrders[0]?.country || '',
      },
    });

  } catch (err) {
    console.error('Get customer error:', err);
    return res.status(500).json({ error: 'Failed to fetch customer', details: err.message });
  }
}

// =============================================================================
// PUT update customer (flag/unflag, notes, etc.)
// =============================================================================
async function updateCustomer(req, res, id) {
  try {
    const { is_flagged, flag_reason, accepts_marketing } = req.body;

    // Build update object
    const updates = {};
    if (is_flagged !== undefined) {
      updates.is_flagged = is_flagged;
      updates.flag_reason = is_flagged ? (flag_reason || null) : null;
    }
    if (accepts_marketing !== undefined) {
      updates.accepts_marketing = accepts_marketing;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: customer, error: updateError } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.status(200).json({
      success: true,
      customer,
    });

  } catch (err) {
    console.error('Update customer error:', err);
    return res.status(500).json({ error: 'Failed to update customer', details: err.message });
  }
}