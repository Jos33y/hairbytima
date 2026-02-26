// ==========================================================================
// Admin Dashboard Page - Enhanced with Pending Payments & Low Stock Widgets
// ==========================================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Ticket,
  TrendingUp,
  ArrowRight,
  Clock,
  Eye,
  AlertTriangle,
  CreditCard,
  PackageX,
  Image,
  CheckCircle
} from 'lucide-react';
import { AdminLayout, StatsCard } from '@components/admin';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminDashboard.module.css';

const API_BASE = import.meta.env.VITE_API_URL || '';
const API_URL = `${API_BASE}/api`;

// Format as USD for admin display (all values stored in USD)
const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const AdminDashboard = () => {
  const { getAuthHeaders } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`${API_URL}/admin/stats`, {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
          },
        });

        const data = await response.json();

        if (response.ok) {
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
          setTopProducts(data.topProducts || []);
          setPendingPayments(data.pendingPayments || []);
          setAwaitingConfirmation(data.awaitingConfirmation || []);
          setLowStockProducts(data.lowStockProducts || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []); 

  const getStatusClass = (status) => {
    const statusClasses = {
      pending: styles.statusPending,
      pending_payment: styles.statusPending,
      processing: styles.statusProcessing,
      shipped: styles.statusShipped,
      delivered: styles.statusDelivered,
      cancelled: styles.statusCancelled,
    };
    return statusClasses[status] || '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStatusLabel = (status) => {
    if (status === 'pending_payment') return 'Pending';
    return status?.charAt(0).toUpperCase() + status?.slice(1) || '';
  };

  // Calculate pending payments total (orders WITHOUT payment proof)
  const pendingPaymentsTotal = pendingPayments.reduce((sum, p) => sum + (p.total || 0), 0);
  
  // Calculate awaiting confirmation total (orders WITH payment proof - needs admin action)
  const awaitingConfirmationTotal = awaitingConfirmation.reduce((sum, p) => sum + (p.total || 0), 0);

  // Format currency for display (simpler version for stats)
  const formatRevenue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <AdminLayout title="Dashboard" isLoading={isLoading}>
      <div className={styles.dashboard}>
        {/* Welcome Section */}
        <div className={styles.welcome}>
          <h1 className={styles.welcomeTitle}>Welcome back</h1>
          <p className={styles.welcomeText}>
            Here is what is happening with your store today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {/* Total Revenue - DELIVERED orders only (confirmed revenue) */}
          <StatsCard
            title="Total Revenue"
            value={formatRevenue(stats?.revenue?.delivered || 0)}
            icon={DollarSign}
            trend={stats?.revenue?.pending > 0 ? 'up' : undefined}
            trendValue={stats?.revenue?.pending > 0 ? `${formatRevenue(stats.revenue.pending)} pending` : undefined}
            loading={isLoading}
          />
          
          {/* Total Orders */}
          <StatsCard
            title="Total Orders"
            value={stats?.orders?.total || 0}
            icon={ShoppingCart}
            trend={stats?.orders?.last7Days > 0 ? 'up' : undefined}
            trendValue={stats?.orders?.last7Days > 0 ? `${stats.orders.last7Days} this week` : undefined}
            loading={isLoading}
          />
          
          {/* Products */}
          <StatsCard
            title="Products"
            value={stats?.products?.total || 0}
            icon={Package}
            trend={stats?.products?.outOfStock > 0 ? 'down' : undefined}
            trendValue={stats?.products?.outOfStock > 0 ? `${stats.products.outOfStock} out of stock` : undefined}
            loading={isLoading}
          />
          
          {/* Active Coupons */}
          <StatsCard
            title="Active Coupons"
            value={stats?.coupons?.active || 0}
            icon={Ticket}
            loading={isLoading}
          />
        </div>

        {/* Alert Widgets Row */}
        {!isLoading && (
          <div className={styles.alertsRow}>
            {/* Awaiting Confirmation Widget - PRIORITY (needs admin action) */}
            <div className={`${styles.alertCard} ${styles.alertConfirmation}`}>
              <div className={styles.alertHeader}>
                <div className={styles.alertIconUrgent}>
                  <CheckCircle size={20} strokeWidth={1.5} />
                </div>
                <div className={styles.alertInfo}>
                  <h3 className={styles.alertTitle}>Awaiting Confirmation</h3>
                  <p className={styles.alertSubtitle}>
                    {awaitingConfirmation.length > 0 
                      ? `${awaitingConfirmation.length} orders · ${formatUSD(awaitingConfirmationTotal)} total`
                      : 'No orders awaiting confirmation'
                    }
                  </p>
                </div>
                {awaitingConfirmation.length > 0 && (
                  <Link to="/admin/orders?status=awaiting_confirmation" className={styles.alertLinkUrgent}>
                    Review All <ArrowRight size={14} strokeWidth={1.5} />
                  </Link>
                )}
              </div>
              {awaitingConfirmation.length > 0 ? (
                <div className={styles.alertList}>
                  {awaitingConfirmation.slice(0, 3).map(order => (
                    <Link 
                      key={order.id} 
                      to={`/admin/orders?highlight=${order.id}`}
                      className={styles.alertItem}
                    >
                      <div className={styles.alertItemInfo}>
                        <span className={styles.alertItemTitle}>{order.order_number}</span>
                        <span className={styles.alertItemMeta}>{order.customer_name}</span>
                      </div>
                      <span className={styles.proofBadge}>
                        <Image size={12} strokeWidth={1.5} />
                        Proof uploaded
                      </span>
                      <span className={styles.alertItemAmount}>{formatUSD(order.total)}</span>
                      <span className={styles.alertItemAction}>
                        <Eye size={16} strokeWidth={1.5} />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.alertEmpty}>
                  <p>No orders awaiting confirmation</p>
                </div>
              )}
            </div>

            {/* Pending Payments Widget - Waiting for customer payment */}
            <div className={`${styles.alertCard} ${styles.alertPayments}`}>
              <div className={styles.alertHeader}>
                <div className={styles.alertIcon}>
                  <CreditCard size={20} strokeWidth={1.5} />
                </div>
                <div className={styles.alertInfo}>
                  <h3 className={styles.alertTitle}>Pending Payments</h3>
                  <p className={styles.alertSubtitle}>
                    {pendingPayments.length > 0 
                      ? `${pendingPayments.length} orders · ${formatUSD(pendingPaymentsTotal)} total`
                      : 'No pending payments'
                    }
                  </p>
                </div>
                {pendingPayments.length > 0 && (
                  <Link to="/admin/orders?status=pending_payment" className={styles.alertLink}>
                    View All <ArrowRight size={14} strokeWidth={1.5} />
                  </Link>
                )}
              </div>
              {pendingPayments.length > 0 ? (
                <div className={styles.alertList}>
                  {pendingPayments.slice(0, 3).map(payment => (
                    <Link 
                      key={payment.id} 
                      to={`/admin/orders?highlight=${payment.id}`}
                      className={styles.alertItem}
                    >
                      <div className={styles.alertItemInfo}>
                        <span className={styles.alertItemTitle}>{payment.order_number}</span>
                        <span className={styles.alertItemMeta}>{payment.customer_name}</span>
                      </div>
                      <span className={styles.noProofBadge}>
                        <Clock size={12} strokeWidth={1.5} />
                        Awaiting proof
                      </span>
                      <span className={styles.alertItemAmount}>{formatUSD(payment.total)}</span>
                      <span className={styles.alertItemAction}>
                        <Eye size={16} strokeWidth={1.5} />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.alertEmpty}>
                  <p>No pending payments</p>
                </div>
              )}
            </div>

            {/* Low Stock Widget */}
            <div className={`${styles.alertCard} ${styles.alertStock}`}>
              <div className={styles.alertHeader}>
                <div className={styles.alertIcon}>
                  <PackageX size={20} strokeWidth={1.5} />
                </div>
                <div className={styles.alertInfo}>
                  <h3 className={styles.alertTitle}>Inventory Alerts</h3>
                  <p className={styles.alertSubtitle}>
                    {lowStockProducts.length > 0
                      ? `${lowStockProducts.filter(p => p.quantity === 0).length} out of stock · ${lowStockProducts.filter(p => p.quantity > 0).length} low stock`
                      : 'No inventory issues'
                    }
                  </p>
                </div>
                {lowStockProducts.length > 0 && (
                  <Link to="/admin/products?stock=low" className={styles.alertLink}>
                    View All <ArrowRight size={14} strokeWidth={1.5} />
                  </Link>
                )}
              </div>
              {lowStockProducts.length > 0 ? (
                <div className={styles.alertList}>
                  {lowStockProducts.slice(0, 4).map((product, idx) => (
                    <Link 
                      key={`${product.product_id}-${product.length}-${idx}`} 
                      to={`/admin/products?highlight=${product.product_id}`}
                      className={styles.alertItem}
                    >
                      <div className={styles.alertItemInfo}>
                        <span className={styles.alertItemTitle}>{product.product_name}</span>
                        <span className={styles.alertItemMeta}>{product.length} · {product.sku}</span>
                      </div>
                      <div className={styles.stockBadgeWrapper}>
                        {product.quantity === 0 ? (
                          <span className={styles.stockBadgeOut}>
                            <AlertTriangle size={12} strokeWidth={1.5} />
                            Out of stock
                          </span>
                        ) : (
                          <span className={styles.stockBadgeLow}>
                            {product.quantity} left
                          </span>
                        )}
                      </div>
                      <span className={styles.alertItemAction}>
                        <Eye size={16} strokeWidth={1.5} />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.alertEmpty}>
                  <p>No inventory alerts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className={styles.contentGrid}>
          {/* Recent Orders */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent Orders</h2>
              <Link to="/admin/orders" className={styles.cardLink}>
                View All
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </div>
            
            <div className={styles.ordersList}>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={styles.orderItemSkeleton}>
                    <div className={styles.skeletonAvatar} />
                    <div className={styles.skeletonContent}>
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLineShort} />
                    </div>
                  </div>
                ))
              ) : recentOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No orders yet</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <Link 
                    key={order.id} 
                    to={`/admin/orders?highlight=${order.id}`}
                    className={styles.orderItem}
                  >
                    <div className={styles.orderInfo}>
                      <span className={styles.orderNumber}>{order.order_number}</span>
                      <span className={styles.orderCustomer}>{order.customer_name}</span>
                    </div>
                    <div className={styles.orderMeta}>
                      <span className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                        {formatStatusLabel(order.status)}
                      </span>
                      <span className={styles.orderAmount}>
                        {formatUSD(order.total)}
                      </span>
                    </div>
                    <div className={styles.orderDate}>
                      <Clock size={14} strokeWidth={1.5} />
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                    <span className={styles.orderAction}>
                      <Eye size={16} strokeWidth={1.5} />
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Top Products</h2>
              <Link to="/admin/products" className={styles.cardLink}>
                View All
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </div>

            <div className={styles.productsList}>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.productItemSkeleton}>
                    <div className={styles.skeletonContent}>
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLineShort} />
                    </div>
                  </div>
                ))
              ) : topProducts.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No sales data yet</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <Link 
                    key={product.product_id || index} 
                    to={`/admin/products?highlight=${product.product_id}`}
                    className={styles.productItem}
                  >
                    <span className={styles.productRank}>{index + 1}</span>
                    <div className={styles.productInfo}>
                      <span className={styles.productName}>{product.product_name}</span>
                      <span className={styles.productSales}>{product.total_sold} sold</span>
                    </div>
                    <span className={styles.productRevenue}>
                      {formatUSD(product.total_revenue)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h2 className={styles.quickActionsTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link to="/admin/products/new" className={styles.actionCard}>
              <Package size={24} strokeWidth={1.5} />
              <span>Add Product</span>
            </Link>
            <Link to="/admin/coupons/new" className={styles.actionCard}>
              <Ticket size={24} strokeWidth={1.5} />
              <span>Create Coupon</span>
            </Link>
            <Link to="/admin/orders" className={styles.actionCard}>
              <ShoppingCart size={24} strokeWidth={1.5} />
              <span>View Orders</span>
            </Link>
            <Link to="/" target="_blank" className={styles.actionCard}>
              <TrendingUp size={24} strokeWidth={1.5} />
              <span>View Store</span>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;