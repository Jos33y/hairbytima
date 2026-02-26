// =============================================================================
// Admin Stats API - /api/admin/stats
// =============================================================================
// GET: Returns dashboard statistics
// =============================================================================

import { supabase } from '../_lib/supabase.js';
import { verifyAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  try {
    // Get order stats from view
    const { data: orderStats } = await supabase
      .from('order_stats')
      .select('*')
      .single();

    // Get product stats from view
    const { data: productStats } = await supabase
      .from('product_stats')
      .select('*')
      .single();

    // Get customer stats from view
    const { data: customerStats } = await supabase
      .from('customer_stats')
      .select('*')
      .single();

    // =========================================================================
    // COUPON STATS - Count active coupons
    // =========================================================================
    const now = new Date().toISOString();
    
    // Count active coupons (not expired, not reached usage limit)
    const { count: activeCoupons } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`);
    
    // Count total coupons
    const { count: totalCoupons } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true });

    // =========================================================================
    // RECENT ORDERS
    // =========================================================================
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        customer_email,
        total,
        currency,
        status,
        payment_status,
        payment_method,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // =========================================================================
    // LOW STOCK PRODUCTS
    // =========================================================================
    const { data: lowStockProducts } = await supabase
      .from('low_stock_products')
      .select('*')
      .limit(10);

    // =========================================================================
    // PENDING PAYMENTS - Orders WITHOUT payment proof (truly waiting for payment)
    // =========================================================================
    const { data: pendingPayments } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        total,
        currency,
        payment_method,
        payment_proof_url,
        created_at
      `)
      .eq('status', 'pending_payment')
      .is('payment_proof_url', null)
      .order('created_at', { ascending: true })
      .limit(10);

    // =========================================================================
    // AWAITING CONFIRMATION - Orders WITH payment proof uploaded (needs admin action)
    // =========================================================================
    const { data: awaitingConfirmation } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        total,
        currency,
        payment_method,
        payment_proof_url,
        payment_proof_uploaded_at,
        created_at
      `)
      .eq('status', 'pending_payment')
      .not('payment_proof_url', 'is', null)
      .order('payment_proof_uploaded_at', { ascending: true })
      .limit(10);

    // =========================================================================
    // UNREAD NOTIFICATIONS
    // =========================================================================
    const { count: unreadNotifications } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    // =========================================================================
    // REVENUE BY CURRENCY
    // =========================================================================
    const { data: revenueByCurrency } = await supabase
      .from('revenue_by_currency')
      .select('*');

    // =========================================================================
    // TOP PRODUCTS - Include ALL orders (not just delivered)
    // =========================================================================
    // First try the view
    let topProducts = [];
    const { data: topProductsView } = await supabase
      .from('top_products')
      .select('*')
      .limit(5);
    
    // If view is empty, calculate from order_items directly
    if (!topProductsView || topProductsView.length === 0) {
      // Get top products from order_items (excluding cancelled orders)
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          quantity,
          price,
          orders!inner(status)
        `)
        .not('orders.status', 'eq', 'cancelled');
      
      if (orderItemsData && orderItemsData.length > 0) {
        // Aggregate by product
        const productMap = new Map();
        
        for (const item of orderItemsData) {
          const existing = productMap.get(item.product_id) || {
            id: item.product_id,
            name: item.product_name,
            units_sold: 0,
            revenue: 0,
            order_count: 0
          };
          
          existing.units_sold += item.quantity;
          existing.revenue += item.price * item.quantity;
          existing.order_count += 1;
          
          productMap.set(item.product_id, existing);
        }
        
        // Sort by units sold and take top 5
        topProducts = Array.from(productMap.values())
          .sort((a, b) => b.units_sold - a.units_sold)
          .slice(0, 5);
      }
    } else {
      topProducts = topProductsView;
    }

    // =========================================================================
    // CALCULATE REVENUE - DELIVERED vs PENDING
    // =========================================================================
    // Delivered = confirmed revenue (delivered orders only)
    // Pending = orders not yet delivered (pending_payment, processing, shipped)
    const { data: allOrders } = await supabase
      .from('orders')
      .select('total, status, created_at')
      .not('status', 'eq', 'cancelled');
    
    let deliveredRevenue = 0;
    let pendingRevenue = 0;
    let totalRevenue = 0;
    let revenueToday = 0;
    let revenue7Days = 0;
    let revenue30Days = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Statuses that count as "pending" revenue
    const pendingStatuses = ['pending_payment', 'processing', 'shipped'];
    
    if (allOrders) {
      for (const order of allOrders) {
        const orderTotal = parseFloat(order.total) || 0;
        const orderDate = new Date(order.created_at);
        
        totalRevenue += orderTotal;
        
        // Separate delivered vs pending
        if (order.status === 'delivered') {
          deliveredRevenue += orderTotal;
        } else if (pendingStatuses.includes(order.status)) {
          pendingRevenue += orderTotal;
        }
        
        // Time-based calculations (all non-cancelled)
        if (orderDate >= today) {
          revenueToday += orderTotal;
        }
        if (orderDate >= sevenDaysAgo) {
          revenue7Days += orderTotal;
        }
        if (orderDate >= thirtyDaysAgo) {
          revenue30Days += orderTotal;
        }
      }
    }

    // =========================================================================
    // RESPONSE
    // =========================================================================
    return res.status(200).json({
      success: true,
      stats: {
        orders: {
          total: orderStats?.total_orders || 0,
          pending: orderStats?.pending_payment_orders || 0,
          processing: orderStats?.processing_orders || 0,
          shipped: orderStats?.shipped_orders || 0,
          delivered: orderStats?.delivered_orders || 0,
          cancelled: orderStats?.cancelled_orders || 0,
          // Calculate from our queries for accuracy
          awaitingConfirmation: awaitingConfirmation?.length || 0,
          pendingPaymentOnly: pendingPayments?.length || 0,
          today: orderStats?.orders_today || 0,
          last7Days: orderStats?.orders_7_days || 0,
        },
        revenue: {
          // Delivered = confirmed revenue (actual money received)
          delivered: deliveredRevenue,
          // Pending = orders awaiting payment/delivery
          pending: pendingRevenue,
          // Total = all non-cancelled
          total: totalRevenue,
          today: revenueToday,
          last7Days: revenue7Days,
          last30Days: revenue30Days,
          avgOrderValue: allOrders?.length > 0 ? totalRevenue / allOrders.length : 0,
          byCurrency: revenueByCurrency || [],
        },
        products: {
          total: productStats?.total_products || 0,
          inStock: productStats?.in_stock_products || 0,
          outOfStock: productStats?.out_of_stock_products || 0,
          featured: productStats?.featured_products || 0,
          archived: productStats?.archived_products || 0,
          lowStockVariants: productStats?.low_stock_variants || 0,
        },
        customers: {
          total: customerStats?.total_customers || 0,
          new30Days: customerStats?.new_customers_30_days || 0,
          new7Days: customerStats?.new_customers_7_days || 0,
          returning: customerStats?.returning_customers || 0,
          avgValue: parseFloat(customerStats?.avg_customer_value || 0),
          avgOrders: parseFloat(customerStats?.avg_orders_per_customer || 0),
        },
        // NEW: Coupon stats
        coupons: {
          active: activeCoupons || 0,
          total: totalCoupons || 0,
        },
        notifications: {
          unread: unreadNotifications || 0,
        },
      },
      recentOrders: recentOrders || [],
      lowStockProducts: lowStockProducts || [],
      pendingPayments: pendingPayments || [],
      awaitingConfirmation: awaitingConfirmation || [],
      topProducts: (topProducts || []).map(p => ({
        product_id: p.id || p.product_id,
        product_name: p.name || p.product_name,
        image: p.image,
        order_count: p.order_count || 0,
        total_sold: p.units_sold || 0,
        total_revenue: parseFloat(p.revenue || 0),
      })),
    });

  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}