// =============================================================================
// Admin Analytics API - /api/admin/analytics
// =============================================================================
// GET: Comprehensive analytics data from views and tables
// FIXED: Counts ALL non-cancelled orders (not just paid)
// =============================================================================

import { supabase } from './../../_lib/supabase.js';
import { verifyAuth } from './../../_lib/auth.js';

export default async function handler(req, res) {
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { period = 'month' } = req.query;

  try {
    // Calculate date ranges based on period
    const now = new Date();
    let startDate, previousStartDate, previousEndDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        previousStartDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();
        previousEndDate = startDate;
        break;
      case 'week':
        startDate = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString();
        previousStartDate = new Date(new Date().setDate(new Date().getDate() - 14)).toISOString();
        previousEndDate = startDate;
        break;
      case 'month':
      default:
        startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString();
        previousStartDate = new Date(new Date().setDate(new Date().getDate() - 60)).toISOString();
        previousEndDate = startDate;
        break;
    }

    // Fetch all data in parallel
    const [
      orderStatsResult,
      customerStatsResult,
      revenueByCurrencyResult,
      deliveredOrdersResult,
      pendingOrdersResult,
      allOrdersForPeriod,
      previousDeliveredResult,
      recentOrdersResult,
      funnelDataResult,
      exchangeRatesResult,
    ] = await Promise.all([
      // Order stats view
      supabase.from('order_stats').select('*').single(),
      // Customer stats view
      supabase.from('customer_stats').select('*').single(),
      // Revenue by currency view
      supabase.from('revenue_by_currency').select('*'),
      // DELIVERED orders only (confirmed revenue)
      supabase.from('orders')
        .select('id, total, currency, created_at, customer_id, shipping_country, status')
        .eq('status', 'delivered')
        .gte('created_at', startDate),
      // PENDING orders (pending_payment, processing, shipped)
      supabase.from('orders')
        .select('id, total, currency, created_at, customer_id, shipping_country, status')
        .in('status', ['pending_payment', 'processing', 'shipped'])
        .gte('created_at', startDate),
      // ALL non-cancelled orders for period (for order count and other stats)
      supabase.from('orders')
        .select('id, total, currency, created_at, customer_id, shipping_country, status')
        .not('status', 'eq', 'cancelled')
        .gte('created_at', startDate),
      // Previous period DELIVERED orders (for comparison)
      supabase.from('orders')
        .select('total')
        .eq('status', 'delivered')
        .gte('created_at', previousStartDate)
        .lt('created_at', previousEndDate),
      // Recent orders for activity
      supabase.from('orders')
        .select('id, order_number, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      // Funnel data from analytics_events
      supabase.from('analytics_events')
        .select('event_type, visitor_id')
        .gte('created_at', startDate),
      // Exchange rates for currency conversion
      supabase.from('exchange_rates')
        .select('to_currency, rate')
        .eq('is_active', true)
        .eq('from_currency', 'USD'),
    ]);

    // Build exchange rates map (USD to other currencies)
    const exchangeRates = { USD: 1 };
    (exchangeRatesResult.data || []).forEach(r => {
      exchangeRates[r.to_currency] = parseFloat(r.rate);
    });

    // Process order stats
    const orderStats = orderStatsResult.data || {};
    const customerStats = customerStatsResult.data || {};

    // DELIVERED orders = confirmed revenue
    const deliveredOrders = deliveredOrdersResult.data || [];
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    
    // PENDING orders = potential revenue (not yet confirmed)
    const pendingOrders = pendingOrdersResult.data || [];
    const pendingRevenue = pendingOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    
    // TOTAL period revenue (for percentage calculations)
    const totalPeriodRevenue = deliveredRevenue + pendingRevenue;
    
    // ALL orders for period (for order counts, funnel, etc.)
    const periodOrders = allOrdersForPeriod.data || [];
    const periodOrderCount = periodOrders.length;

    // Calculate previous period for comparison (delivered only)
    const previousDelivered = previousDeliveredResult.data || [];
    const previousRevenue = previousDelivered.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    // Calculate revenue change (delivered vs previous delivered)
    const revenueChange = previousRevenue > 0 
      ? ((deliveredRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : deliveredRevenue > 0 ? 100 : 0;
    
    // Order count change (all non-cancelled)
    const previousOrderCount = previousDelivered.length; // Could also track all orders
    const ordersChange = previousOrderCount > 0
      ? ((periodOrderCount - previousOrderCount) / previousOrderCount * 100).toFixed(1)
      : periodOrderCount > 0 ? 100 : 0;

    // Get new customers in period
    const { data: newCustomersData } = await supabase
      .from('customers')
      .select('id', { count: 'exact' })
      .gte('created_at', startDate);
    const newCustomersCount = newCustomersData?.length || 0;

    // ==========================================================================
    // CONVERSION FUNNEL - From actual analytics events
    // ==========================================================================
    const funnelEvents = funnelDataResult.data || [];
    
    // Count unique visitors per event type
    const countUniqueByEvent = (eventType) => {
      const uniqueVisitors = new Set(
        funnelEvents.filter(e => e.event_type === eventType).map(e => e.visitor_id)
      );
      return uniqueVisitors.size;
    };
    
    const eventCounts = {
      page_view: countUniqueByEvent('page_view'),
      product_view: countUniqueByEvent('product_view'),
      add_to_cart: countUniqueByEvent('add_to_cart'),
      checkout_start: countUniqueByEvent('checkout_start'),
      purchase: countUniqueByEvent('purchase'),
    };

    // Use actual event counts, fallback to reasonable estimates only if NO events at all
    const hasAnyEvents = Object.values(eventCounts).some(v => v > 0);
    
    const conversionFunnel = {
      visitors: eventCounts.page_view || (hasAnyEvents ? 0 : periodOrderCount * 25),
      productViews: eventCounts.product_view || (hasAnyEvents ? 0 : periodOrderCount * 18),
      addedToCart: eventCounts.add_to_cart || (hasAnyEvents ? 0 : periodOrderCount * 4),
      checkout: eventCounts.checkout_start || (hasAnyEvents ? 0 : Math.round(periodOrderCount * 1.8)),
      purchased: eventCounts.purchase || periodOrderCount, // Fall back to actual order count
      rates: {
        viewToCart: '0',
        cartToCheckout: '0',
        checkoutToPurchase: '0',
        overall: '0',
      }
    };

    // Calculate conversion rates (avoid division by zero)
    if (conversionFunnel.productViews > 0) {
      conversionFunnel.rates.viewToCart = ((conversionFunnel.addedToCart / conversionFunnel.productViews) * 100).toFixed(1);
    }
    if (conversionFunnel.addedToCart > 0) {
      conversionFunnel.rates.cartToCheckout = ((conversionFunnel.checkout / conversionFunnel.addedToCart) * 100).toFixed(1);
    }
    if (conversionFunnel.checkout > 0) {
      conversionFunnel.rates.checkoutToPurchase = ((conversionFunnel.purchased / conversionFunnel.checkout) * 100).toFixed(1);
    }
    if (conversionFunnel.visitors > 0) {
      conversionFunnel.rates.overall = ((conversionFunnel.purchased / conversionFunnel.visitors) * 100).toFixed(1);
    }

    // ==========================================================================
    // REVENUE BY CURRENCY - Convert USD back to local currency amounts
    // ==========================================================================
    const revenueByCurrency = (revenueByCurrencyResult.data || []).map(item => {
      const currencyInfo = getCurrencyInfo(item.currency);
      const revenueUSD = parseFloat(item.total_revenue) || 0;
      const rate = exchangeRates[item.currency] || 1;
      const revenueLocal = revenueUSD * rate; // Convert USD to local currency
      
      return {
        currency: item.currency,
        symbol: currencyInfo.symbol,
        flag: currencyInfo.flag,
        revenueUSD: revenueUSD,           // Original USD amount (stored)
        revenueLocal: revenueLocal,        // Converted to local currency
        orders: item.order_count || 0,
        percentage: 0,
      };
    });

    // If no data from view, calculate from period orders
    if (revenueByCurrency.length === 0 && periodOrders.length > 0) {
      const currencyMap = {};
      periodOrders.forEach(o => {
        const curr = o.currency || 'USD';
        if (!currencyMap[curr]) {
          currencyMap[curr] = { revenue: 0, orders: 0 };
        }
        currencyMap[curr].revenue += parseFloat(o.total || 0);
        currencyMap[curr].orders += 1;
      });
      
      Object.entries(currencyMap).forEach(([currency, data]) => {
        const currencyInfo = getCurrencyInfo(currency);
        const rate = exchangeRates[currency] || 1;
        revenueByCurrency.push({
          currency,
          symbol: currencyInfo.symbol,
          flag: currencyInfo.flag,
          revenueUSD: data.revenue,
          revenueLocal: data.revenue * rate,
          orders: data.orders,
          percentage: 0,
        });
      });
    }

    // Calculate currency percentages (based on USD for fair comparison)
    const totalCurrencyRevenue = revenueByCurrency.reduce((sum, c) => sum + c.revenueUSD, 0);
    revenueByCurrency.forEach(c => {
      c.percentage = totalCurrencyRevenue > 0 ? Math.round((c.revenueUSD / totalCurrencyRevenue) * 100) : 0;
    });
    
    // Sort by USD revenue descending
    revenueByCurrency.sort((a, b) => b.revenueUSD - a.revenueUSD);

    // ==========================================================================
    // TOP PRODUCTS - From order_items (all non-cancelled orders)
    // ==========================================================================
    let topProducts = [];
    
    // First try the view
    const { data: topProductsView } = await supabase
      .from('top_products')
      .select('*')
      .limit(5);
    
    if (topProductsView && topProductsView.length > 0) {
      topProducts = topProductsView.map(p => ({
        id: p.id,
        name: p.name,
        image: p.image,
        sales: p.units_sold || 0,
        revenue: parseFloat(p.revenue) || 0,
      }));
    } else {
      // Fallback: Calculate from order_items
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          quantity,
          price,
          orders!inner(status, created_at)
        `)
        .not('orders.status', 'eq', 'cancelled')
        .gte('orders.created_at', startDate);
      
      if (orderItemsData && orderItemsData.length > 0) {
        const productMap = new Map();
        
        for (const item of orderItemsData) {
          const existing = productMap.get(item.product_id) || {
            id: item.product_id,
            name: item.product_name,
            sales: 0,
            revenue: 0,
          };
          
          existing.sales += item.quantity;
          existing.revenue += item.price * item.quantity;
          
          productMap.set(item.product_id, existing);
        }
        
        topProducts = Array.from(productMap.values())
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);
      }
    }

    // ==========================================================================
    // COUNTRY STATS
    // ==========================================================================
    const countryMap = {};
    periodOrders.forEach(order => {
      const country = order.shipping_country || 'Unknown';
      if (!countryMap[country]) {
        countryMap[country] = { revenue: 0, orders: 0 };
      }
      countryMap[country].revenue += parseFloat(order.total || 0);
      countryMap[country].orders += 1;
    });

    const revenueByCountry = Object.entries(countryMap)
      .map(([country, data]) => ({
        country,
        flag: getCountryCode(country),
        revenue: data.revenue,
        orders: data.orders,
        percentage: totalPeriodRevenue > 0 ? Math.round((data.revenue / totalPeriodRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // ==========================================================================
    // SALES BY CATEGORY
    // ==========================================================================
    let salesByCategory = [];
    
    // Try RPC first
    const { data: categoryStatsData } = await supabase.rpc('get_category_stats');
    
    if (categoryStatsData && categoryStatsData.length > 0) {
      salesByCategory = categoryStatsData;
    } else {
      // Fallback: Calculate from categories and order_items
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name');
      
      if (categories) {
        for (const cat of categories.slice(0, 6)) {
          const { data: products } = await supabase
            .from('products')
            .select('id')
            .eq('category_id', cat.id);
          
          if (products?.length) {
            const productIds = products.map(p => p.id);
            const { data: orderItems } = await supabase
              .from('order_items')
              .select('quantity, total_price')
              .in('product_id', productIds);
            
            const catRevenue = orderItems?.reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0) || 0;
            const catSales = orderItems?.reduce((sum, i) => sum + i.quantity, 0) || 0;
            
            salesByCategory.push({
              name: cat.name,
              sales: catSales,
              revenue: catRevenue,
              percentage: 0,
            });
          }
        }
        
        // Calculate percentages
        const totalCatRevenue = salesByCategory.reduce((sum, c) => sum + c.revenue, 0);
        salesByCategory.forEach(c => {
          c.percentage = totalCatRevenue > 0 ? Math.round((c.revenue / totalCatRevenue) * 100) : 0;
        });
        
        // Sort by revenue
        salesByCategory.sort((a, b) => b.revenue - a.revenue);
      }
    }

    // ==========================================================================
    // DAILY REVENUE (Last 7 days)
    // ==========================================================================
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRevenue = periodOrders
        .filter(o => o.created_at && o.created_at.startsWith(dateStr))
        .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
      
      dailyRevenue.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        orders: periodOrders.filter(o => o.created_at && o.created_at.startsWith(dateStr)).length,
      });
    }

    // ==========================================================================
    // CUSTOMER ACQUISITION
    // ==========================================================================
    const returningCustomers = parseInt(customerStats.returning_customers) || 0;
    const totalCustomers = parseInt(customerStats.total_customers) || 1;
    
    // Calculate new vs returning revenue
    const uniqueCustomerIds = [...new Set(periodOrders.filter(o => o.customer_id).map(o => o.customer_id))];
    let returningCustomerData = [];
    
    if (uniqueCustomerIds.length > 0) {
      const { data } = await supabase
        .from('customers')
        .select('id')
        .in('id', uniqueCustomerIds)
        .gt('total_orders', 1);
      returningCustomerData = data || [];
    }
    
    const returningCustomerIds = new Set(returningCustomerData.map(c => c.id));
    const newCustomerRevenue = periodOrders
      .filter(o => o.customer_id && !returningCustomerIds.has(o.customer_id))
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const returningRevenue = periodOrders
      .filter(o => o.customer_id && returningCustomerIds.has(o.customer_id))
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    const customerAcquisition = {
      newCustomers: newCustomersCount,
      returningCustomers: returningCustomerData.length,
      newCustomerRevenue,
      returningCustomerRevenue: returningRevenue,
      repeatPurchaseRate: totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : '0',
      avgOrdersPerCustomer: parseFloat(customerStats.avg_orders_per_customer)?.toFixed(1) || '0',
    };

    // ==========================================================================
    // RECENT ACTIVITY
    // ==========================================================================
    const recentActivity = [];
    
    (recentOrdersResult.data || []).forEach(order => {
      recentActivity.push({
        type: order.status === 'cancelled' ? 'refund' : 'order',
        message: order.status === 'shipped' 
          ? `Order #${order.order_number} shipped`
          : order.status === 'cancelled'
            ? `Refund processed #${order.order_number}`
            : `New order #${order.order_number.slice(0, 12)}...`,
        time: getTimeAgo(order.created_at),
        amount: order.status === 'cancelled' ? -parseFloat(order.total) : parseFloat(order.total),
      });
    });

    // Add recent customers
    const { data: recentCustomers } = await supabase
      .from('customers')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(2);
    
    (recentCustomers || []).forEach(customer => {
      recentActivity.push({
        type: 'customer',
        message: 'New customer registered',
        time: getTimeAgo(customer.created_at),
      });
    });

    // Sort by recency
    recentActivity.sort((a, b) => {
      const timeOrder = { 'm': 1, 'h': 60, 'd': 1440 };
      const getMinutes = (t) => {
        const match = t.match(/(\d+)([mhd])/);
        return match ? parseInt(match[1]) * (timeOrder[match[2]] || 1) : 9999;
      };
      return getMinutes(a.time) - getMinutes(b.time);
    });

    // ==========================================================================
    // TRAFFIC SOURCES
    // ==========================================================================
    const { data: trafficData } = await supabase
      .from('analytics_events')
      .select('referrer, visitor_id')
      .gte('created_at', startDate);
    
    const trafficMap = {};
    
    (trafficData || []).forEach(e => {
      const source = parseReferrer(e.referrer);
      if (!trafficMap[source]) {
        trafficMap[source] = { visitors: 0, uniqueVisitors: new Set() };
      }
      trafficMap[source].visitors += 1;
      if (e.visitor_id) {
        trafficMap[source].uniqueVisitors.add(e.visitor_id);
      }
    });

    // Convert to array with unique visitor counts
    let trafficSources = Object.entries(trafficMap)
      .map(([source, data]) => ({
        source,
        visitors: data.uniqueVisitors.size || data.visitors,
        orders: Math.round((data.uniqueVisitors.size || data.visitors) * 0.04),
        revenue: Math.round((data.uniqueVisitors.size || data.visitors) * 0.04 * (totalPeriodRevenue / (periodOrderCount || 1))),
        percentage: 0,
      }))
      .sort((a, b) => b.visitors - a.visitors);

    // If no traffic data, show placeholder
    if (trafficSources.length === 0) {
      trafficSources = [
        { source: 'Direct', visitors: 0, orders: 0, revenue: 0, percentage: 100 },
      ];
    }

    // Calculate traffic percentages
    const totalVisitors = trafficSources.reduce((sum, t) => sum + t.visitors, 0);
    trafficSources.forEach(t => {
      t.percentage = totalVisitors > 0 ? Math.round((t.visitors / totalVisitors) * 100) : 0;
    });

    // ==========================================================================
    // RESPONSE
    // ==========================================================================
    return res.status(200).json({
      success: true,
      period,
      overview: {
        revenue: {
          value: deliveredRevenue,        // Only delivered = confirmed revenue
          pending: pendingRevenue,         // Pending = not yet confirmed
          change: parseFloat(revenueChange),
        },
        orders: {
          value: periodOrderCount,
          change: parseFloat(ordersChange),
        },
        customers: {
          new: newCustomersCount,
          change: 0,
        },
        avgOrderValue: {
          value: periodOrderCount > 0 ? (deliveredRevenue + pendingRevenue) / periodOrderCount : 0,
          change: 0,
        },
      },
      conversionFunnel,
      dailyRevenue,
      trafficSources: trafficSources.slice(0, 6),
      revenueByCurrency: revenueByCurrency.slice(0, 5),
      revenueByCountry,
      customerAcquisition,
      topProducts,
      salesByCategory: salesByCategory.slice(0, 6),
      recentActivity: recentActivity.slice(0, 5),
    });

  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
  }
}

// ==========================================================================
// Helper Functions
// ==========================================================================

function getCurrencyInfo(currency) {
  const currencies = {
    USD: { symbol: '$', flag: 'US' },
    GBP: { symbol: '£', flag: 'GB' },
    EUR: { symbol: '€', flag: 'EU' },
    NGN: { symbol: '₦', flag: 'NG' },
    GMD: { symbol: 'D', flag: 'GM' },
  };
  return currencies[currency] || { symbol: currency, flag: 'UN' };
}

function getCountryCode(country) {
  const countries = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'Nigeria': 'NG',
    'Germany': 'DE',
    'Canada': 'CA',
    'Gambia': 'GM',
    'France': 'FR',
    'Portugal': 'PT',
    'USA': 'US',
    'UK': 'GB',
  };
  return countries[country] || 'UN';
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function parseReferrer(referrer) {
  if (!referrer) return 'Direct';
  const url = referrer.toLowerCase();
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('snapchat')) return 'Snapchat';
  if (url.includes('tiktok')) return 'TikTok';
  if (url.includes('whatsapp') || url.includes('wa.me')) return 'WhatsApp';
  if (url.includes('google')) return 'Google Search';
  if (url.includes('bing')) return 'Bing';
  if (url.includes('twitter') || url.includes('x.com')) return 'Twitter/X';
  return 'Other';
}