// =============================================================================
// Admin Orders API - /api/admin/orders
// =============================================================================
// GET: List all orders with items
// PUT: Update order (status, tracking, notes, etc.) + Send emails
// =============================================================================

import { supabase } from './../../_lib/supabase.js';
import { verifyAuth } from './../../_lib/auth.js';
import { 
  sendPaymentConfirmed, 
  sendShippingNotification, 
  sendDeliveryConfirmation,
  sendPaymentRejected,
} from './../../_lib/resend.js';

export default async function handler(req, res) {
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      if (id) {
        return getOrder(req, res, id);
      }
      return getOrders(req, res);
    case 'PUT':
      if (!id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }
      return updateOrder(req, res, id, admin);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// =============================================================================
// GET all orders
// =============================================================================
async function getOrders(req, res) {
  try {
    const { 
      status: filterStatus, 
      payment_status, 
      search,
      limit = 50,
      page = 1,
    } = req.query;

    // Build query
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Status filter
    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    // Payment status filter
    if (payment_status && payment_status !== 'all') {
      query = query.eq('payment_status', payment_status);
    }

    // Search filter
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: orders, error: fetchError, count } = await query;

    if (fetchError) throw fetchError;

    // Get order items for all orders
    const orderIds = orders.map(o => o.id);
    const { data: allItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    // Format response
    const formattedOrders = orders.map(order => {
      const items = allItems?.filter(i => i.order_id === order.id) || [];
      
      return {
        id: order.id,
        orderNumber: order.order_number,
        customer: {
          id: order.customer_id,
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
        },
        items: items.map(item => ({
          id: item.id,
          productId: item.product_id,
          variantId: item.variant_id,
          name: item.product_name,
          image: item.product_image,
          sku: item.product_sku,
          length: item.length,
          quantity: item.quantity,
          price: parseFloat(item.unit_price),
          total: parseFloat(item.total_price),
        })),
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: parseFloat(order.subtotal),
        discount: parseFloat(order.discount) || 0,
        discountCode: order.coupon_code,
        shipping: parseFloat(order.shipping_cost) || 0,
        total: parseFloat(order.total),
        currency: order.currency,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        paymentProof: order.payment_proof_url ? {
          url: order.payment_proof_url,
          type: order.payment_proof_type,
          uploadedAt: order.payment_proof_uploaded_at,
        } : null,
        shippingAddress: {
          firstName: order.shipping_first_name,
          lastName: order.shipping_last_name,
          address: order.shipping_address,
          apartment: order.shipping_apartment,
          city: order.shipping_city,
          state: order.shipping_state,
          postalCode: order.shipping_postal_code,
          country: order.shipping_country,
          countryCode: order.shipping_country_code,
        },
        trackingNumber: order.tracking_number,
        carrier: order.carrier,
        courierPhone: order.courier_phone,
        trackingUrl: order.tracking_url,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
        isGift: order.is_gift,
        giftMessage: order.gift_message,
        customerNotes: order.customer_notes,
        adminNotes: order.admin_notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      };
    });

    // Calculate stats
    const { data: allOrders } = await supabase
      .from('orders')
      .select('status, payment_status, payment_proof_url');

    const orderCounts = {
      all: allOrders?.length || 0,
      pending_payment: allOrders?.filter(o => o.status === 'pending_payment').length || 0,
      processing: allOrders?.filter(o => o.status === 'processing').length || 0,
      shipped: allOrders?.filter(o => o.status === 'shipped').length || 0,
      delivered: allOrders?.filter(o => o.status === 'delivered').length || 0,
      cancelled: allOrders?.filter(o => o.status === 'cancelled').length || 0,
      // Orders with payment proof uploaded but not yet confirmed
      awaitingConfirmation: allOrders?.filter(o => 
        o.status === 'pending_payment' && o.payment_proof_url
      ).length || 0,
    };

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
      orderCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (err) {
    console.error('Get orders error:', err);
    return res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
}

// =============================================================================
// GET single order with full details
// =============================================================================
async function getOrder(req, res, id) {
  try {
    // Get order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    // Get timeline
    const { data: timeline, error: timelineError } = await supabase
      .from('order_timeline')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });

    // Format response
    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        customer: {
          id: order.customer_id,
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone,
        },
        items: items?.map(item => ({
          id: item.id,
          productId: item.product_id,
          variantId: item.variant_id,
          name: item.product_name,
          image: item.product_image,
          sku: item.product_sku,
          length: item.length,
          quantity: item.quantity,
          price: parseFloat(item.unit_price),
          total: parseFloat(item.total_price),
        })) || [],
        subtotal: parseFloat(order.subtotal),
        discount: parseFloat(order.discount) || 0,
        discountCode: order.coupon_code,
        shipping: parseFloat(order.shipping_cost) || 0,
        total: parseFloat(order.total),
        currency: order.currency,
        status: order.status,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        paymentReference: order.payment_reference,
        paymentConfirmedAt: order.payment_confirmed_at,
        paymentProof: order.payment_proof_url ? {
          url: order.payment_proof_url,
          type: order.payment_proof_type,
          uploadedAt: order.payment_proof_uploaded_at,
        } : null,
        rejectionReason: order.rejection_reason,
        shippingAddress: {
          firstName: order.shipping_first_name,
          lastName: order.shipping_last_name,
          address: order.shipping_address,
          apartment: order.shipping_apartment,
          city: order.shipping_city,
          state: order.shipping_state,
          postalCode: order.shipping_postal_code,
          country: order.shipping_country,
          countryCode: order.shipping_country_code,
        },
        trackingNumber: order.tracking_number,
        carrier: order.carrier,
        courierPhone: order.courier_phone,
        trackingUrl: order.tracking_url,
        shippedAt: order.shipped_at,
        deliveredAt: order.delivered_at,
        isGift: order.is_gift,
        giftMessage: order.gift_message,
        customerNotes: order.customer_notes,
        adminNotes: order.admin_notes,
        timeline: timeline?.map(t => ({
          action: t.action,
          details: t.description,  // DB column is 'description'
          by: t.performed_by === 'admin' ? 'Admin' : t.performed_by === 'customer' ? 'Customer' : 'System',
          timestamp: t.created_at,
        })) || [],
        notes: parseAdminNotes(order.admin_notes),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });

  } catch (err) {
    console.error('Get order error:', err);
    return res.status(500).json({ error: 'Failed to fetch order', details: err.message });
  }
}

// Helper to parse admin notes into array format for frontend
function parseAdminNotes(notesString) {
  if (!notesString) return [];
  
  // Notes are stored as "[timestamp] note text\n\n[timestamp] note text"
  const noteBlocks = notesString.split('\n\n').filter(Boolean);
  
  return noteBlocks.map(block => {
    const match = block.match(/^\[(.+?)\]\s*(.*)$/s);
    if (match) {
      return {
        timestamp: match[1],
        text: match[2],
        by: 'Admin',
      };
    }
    return { text: block, timestamp: null, by: 'Admin' };
  });
}

// =============================================================================
// PUT update order
// =============================================================================
async function updateOrder(req, res, id, admin) {
  try {
    const { action, ...data } = req.body;

    // Get current order with full details for email
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updates = {};
    let timelineEntry = null;
    let emailToSend = null;

    // Handle specific actions
    switch (action) {
      case 'confirm_payment':
        updates.payment_status = 'paid';
        updates.status = 'processing';
        updates.payment_confirmed_at = new Date().toISOString();
        updates.payment_confirmed_by = admin.id;
        timelineEntry = { action: 'Payment confirmed', actor_type: 'admin' };
        emailToSend = 'payment_confirmed';
        break;

      case 'reject_payment':
        updates.payment_status = 'rejected';
        updates.payment_proof_url = null;
        updates.payment_proof_type = null;
        updates.payment_proof_uploaded_at = null;
        updates.rejection_reason = data.rejection_reason || 'Payment proof could not be verified. Please upload a new proof of payment.';
        timelineEntry = { 
          action: 'Payment proof rejected', 
          details: updates.rejection_reason,
          actor_type: 'admin' 
        };
        emailToSend = 'payment_rejected';
        break;

      case 'ship':
        if (!data.carrier) {
          return res.status(400).json({ error: 'Carrier name is required' });
        }
        updates.status = 'shipped';
        updates.carrier = data.carrier;
        updates.tracking_number = data.tracking_number || null;
        updates.courier_phone = data.courier_phone || null;
        updates.tracking_url = data.tracking_url || null;
        updates.shipped_at = new Date().toISOString();
        
        // Build timeline details
        const trackingDetails = [];
        if (data.tracking_number) trackingDetails.push(`Tracking: ${data.tracking_number}`);
        if (data.courier_phone) trackingDetails.push(`Phone: ${data.courier_phone}`);
        
        timelineEntry = { 
          action: `Shipped via ${data.carrier}`, 
          details: trackingDetails.length > 0 ? trackingDetails.join(' | ') : null, 
          actor_type: 'admin' 
        };
        emailToSend = 'shipped';
        break;

      case 'mark_delivered':
        updates.status = 'delivered';
        updates.delivered_at = new Date().toISOString();
        timelineEntry = { action: 'Marked as delivered', actor_type: 'admin' };
        emailToSend = 'delivered';
        break;

      case 'cancel':
        updates.status = 'cancelled';
        timelineEntry = { action: 'Order cancelled', actor_type: 'admin' };
        // TODO: Restore stock quantities
        // TODO: Send cancellation email?
        break;

      case 'add_note':
        if (!data.note) {
          return res.status(400).json({ error: 'Note is required' });
        }
        // Append to existing notes
        const existingNotes = currentOrder.admin_notes || '';
        const timestamp = new Date().toISOString();
        const newNote = `[${timestamp}] ${data.note}`;
        updates.admin_notes = existingNotes ? `${existingNotes}\n\n${newNote}` : newNote;
        timelineEntry = { action: 'Admin note added', details: data.note, actor_type: 'admin' };
        break;

      default:
        // Direct field updates
        if (data.status) updates.status = data.status;
        if (data.payment_status) updates.payment_status = data.payment_status;
        if (data.tracking_number !== undefined) updates.tracking_number = data.tracking_number;
        if (data.carrier !== undefined) updates.carrier = data.carrier;
        if (data.admin_notes !== undefined) updates.admin_notes = data.admin_notes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add timeline entry if applicable
    if (timelineEntry) {
      await supabase
        .from('order_timeline')
        .insert({
          order_id: id,
          action: timelineEntry.action,
          description: timelineEntry.details || null,  // DB column is 'description'
          performed_by: timelineEntry.actor_type,       // DB column is 'performed_by'
          admin_id: admin.id,
        });
    }

    // Send email notifications
    let emailResult = null;
    if (emailToSend) {
      emailResult = await sendOrderEmail(emailToSend, currentOrder, updatedOrder, data);
    }

    return res.status(200).json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.payment_status,
        trackingNumber: updatedOrder.tracking_number,
        carrier: updatedOrder.carrier,
      },
      message: action ? `Order ${action.replace('_', ' ')} successful` : 'Order updated successfully',
      emailSent: emailResult?.success || false,
    });

  } catch (err) {
    console.error('Update order error:', err);
    return res.status(500).json({ error: 'Failed to update order', details: err.message });
  }
}

// =============================================================================
// Send order notification emails
// =============================================================================
async function sendOrderEmail(type, originalOrder, updatedOrder, actionData) {
  try {
    // Get exchange rate for currency conversion in emails
    let exchangeRate = 1;
    if (originalOrder.currency && originalOrder.currency !== 'USD') {
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'USD')
        .eq('to_currency', originalOrder.currency)
        .eq('is_active', true)
        .single();
      
      if (rateData?.rate) {
        exchangeRate = parseFloat(rateData.rate);
      }
    }

    // Build order object for email templates
    const orderForEmail = {
      order_number: originalOrder.order_number,
      customer_email: originalOrder.customer_email,
      customer_name: originalOrder.customer_name,
      shipping_first_name: originalOrder.shipping_first_name,
      shipping_last_name: originalOrder.shipping_last_name,
      shipping_address: originalOrder.shipping_address,
      shipping_apartment: originalOrder.shipping_apartment,
      shipping_city: originalOrder.shipping_city,
      shipping_state: originalOrder.shipping_state,
      shipping_postal_code: originalOrder.shipping_postal_code,
      shipping_country: originalOrder.shipping_country,
      total: originalOrder.total,
      currency: originalOrder.currency,
      tracking_number: updatedOrder.tracking_number,
      carrier: updatedOrder.carrier,
      courier_phone: updatedOrder.courier_phone,
      tracking_url: updatedOrder.tracking_url,
      rejection_reason: updatedOrder.rejection_reason,
    };

    switch (type) {
      case 'payment_confirmed':
        console.log('📧 Sending payment confirmed email...');
        return await sendPaymentConfirmed(orderForEmail, exchangeRate);

      case 'payment_rejected':
        console.log('📧 Sending payment rejected email...');
        return await sendPaymentRejected(orderForEmail);

      case 'shipped':
        console.log('📧 Sending shipping notification email...');
        return await sendShippingNotification(
          orderForEmail, 
          updatedOrder.tracking_number, 
          updatedOrder.carrier,
          updatedOrder.courier_phone,
          updatedOrder.tracking_url
        );

      case 'delivered':
        console.log('📧 Sending delivery confirmation email...');
        return await sendDeliveryConfirmation(orderForEmail);

      default:
        return { success: false, error: 'Unknown email type' };
    }
  } catch (err) {
    console.error('Send order email error:', err);
    return { success: false, error: err.message };
  }
}