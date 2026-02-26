import { supabase } from './supabase';

const statsService = {
  async getOrderStats() {
    // Get total orders and revenue
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total, status, created_at');

    if (error) throw error; 

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current period (last 30 days)
    const currentOrders = orders.filter(
      (o) => new Date(o.created_at) >= thirtyDaysAgo
    );
    const currentRevenue = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Previous period (30-60 days ago)
    const previousOrders = orders.filter(
      (o) =>
        new Date(o.created_at) >= sixtyDaysAgo &&
        new Date(o.created_at) < thirtyDaysAgo
    );
    const previousRevenue = previousOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Calculate trends
    const revenueTrend =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const ordersTrend =
      previousOrders.length > 0
        ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
        : 0;

    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
      currentPeriodOrders: currentOrders.length,
      currentPeriodRevenue: currentRevenue,
      ordersTrend: Math.round(ordersTrend * 10) / 10,
      revenueTrend: Math.round(revenueTrend * 10) / 10,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      processingOrders: orders.filter((o) => o.status === 'processing').length,
    };
  },

  async getProductStats() {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, in_stock');

    if (error) throw error;

    return {
      totalProducts: products.length,
      inStock: products.filter((p) => p.in_stock).length,
      outOfStock: products.filter((p) => !p.in_stock).length,
    };
  },

  async getCouponStats() {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('id, is_active, current_uses, expires_at');

    if (error) throw error;

    const now = new Date();
    const activeCoupons = coupons.filter(
      (c) => c.is_active && (!c.expires_at || new Date(c.expires_at) > now)
    );

    return {
      totalCoupons: coupons.length,
      activeCoupons: activeCoupons.length,
      totalUsage: coupons.reduce((sum, c) => sum + (c.current_uses || 0), 0),
    };
  },

  async getRecentOrders(limit = 5) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getTopProducts(limit = 5) {
    // Get order items grouped by product
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, price');

    if (error) throw error;

    // Aggregate by product
    const productStats = {};
    orderItems.forEach((item) => {
      if (!productStats[item.product_id]) {
        productStats[item.product_id] = {
          id: item.product_id,
          name: item.product_name,
          sales: 0,
          revenue: 0,
        };
      }
      productStats[item.product_id].sales += item.quantity;
      productStats[item.product_id].revenue += item.quantity * item.price;
    });

    // Sort by sales and return top N
    return Object.values(productStats)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);
  },

  async getDashboardStats() {
    const [orderStats, productStats, couponStats, recentOrders, topProducts] =
      await Promise.all([
        this.getOrderStats(),
        this.getProductStats(),
        this.getCouponStats(),
        this.getRecentOrders(5),
        this.getTopProducts(4),
      ]);

    return {
      ...orderStats,
      ...productStats,
      ...couponStats,
      recentOrders,
      topProducts,
    };
  },
};

