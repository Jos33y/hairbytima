// ==========================================================================
// Admin Analytics Page - Enhanced with Conversion Funnel, Traffic, Geography
// ==========================================================================

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  MousePointer,
  Eye,
  CreditCard,
  RefreshCw,
  Filter,
  Clock
} from 'lucide-react';
import { AdminLayout } from '@components/admin';
import { getCurrencyFlag, getCountryFlag } from '@components/common/CurrencyFlags';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminAnalytics.module.css';

const AdminAnalytics = () => {
  const { getAuthHeaders } = useAuthStore();
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Format large numbers compactly (e.g., $2.7K, $1.5M)
  const formatCompactCurrency = (value) => {
    if (!value || value === 0) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${Math.round(value)}`;
  };

  const getMaxRevenue = () => {
    if (!analytics?.dailyRevenue?.length) return 1;
    return Math.max(...analytics.dailyRevenue.map(d => d.revenue)) || 1;
  };

  // Loading skeleton
  if (isLoading || !analytics) {
    return (
      <AdminLayout title="Analytics" isLoading={isLoading}>
        <div className={styles.page}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <h1 className={styles.title}>Analytics</h1>
              <p className={styles.subtitle}>Track your store performance</p>
            </div>
          </div>
          <div className={styles.statsGrid}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`${styles.statCard} ${styles.skeleton}`} />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { overview, conversionFunnel, dailyRevenue, trafficSources, revenueByCurrency, 
          revenueByCountry, customerAcquisition, topProducts, salesByCategory, recentActivity } = analytics;

  return (
    <AdminLayout title="Analytics" isLoading={false}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Analytics</h1>
            <p className={styles.subtitle}>Track your store performance</p>
          </div>
          <div className={styles.periodSelector}>
            {['today', 'week', 'month'].map(p => (
              <button
                key={p}
                className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className={styles.statsGrid}>
          {/* Total Revenue - Shows delivered only, pending as secondary */}
          <div className={styles.statCard}>
            <div className={styles.statIcon}><DollarSign size={20} strokeWidth={1.5} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total Revenue</span>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>{formatCurrency(overview.revenue.value)}</span>
                {overview.revenue.pending > 0 && (
                  <span className={styles.pendingBadge} title="Pending payment confirmation">
                    <Clock size={10} />
                    +{formatCompactCurrency(overview.revenue.pending)}
                  </span>
                )}
              </div>
              {overview.revenue.change !== 0 && (
                <span className={`${styles.statChange} ${overview.revenue.change >= 0 ? styles.positive : styles.negative}`}>
                  {overview.revenue.change >= 0 ? <ArrowUpRight size={14} strokeWidth={2} /> : <ArrowDownRight size={14} strokeWidth={2} />}
                  {Math.abs(overview.revenue.change)}%
                </span>
              )}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}><ShoppingCart size={20} strokeWidth={1.5} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Total Orders</span>
              <span className={styles.statValue}>{overview.orders.value}</span>
              <span className={`${styles.statChange} ${overview.orders.change >= 0 ? styles.positive : styles.negative}`}>
                {overview.orders.change >= 0 ? <ArrowUpRight size={14} strokeWidth={2} /> : <ArrowDownRight size={14} strokeWidth={2} />}
                {Math.abs(overview.orders.change)}%
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}><Users size={20} strokeWidth={1.5} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>New Customers</span>
              <span className={styles.statValue}>{overview.customers.new}</span>
              {overview.customers.change !== 0 && (
                <span className={`${styles.statChange} ${overview.customers.change >= 0 ? styles.positive : styles.negative}`}>
                  {overview.customers.change >= 0 ? <ArrowUpRight size={14} strokeWidth={2} /> : <ArrowDownRight size={14} strokeWidth={2} />}
                  {Math.abs(overview.customers.change)}%
                </span>
              )}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}><TrendingUp size={20} strokeWidth={1.5} /></div>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Avg. Order Value</span>
              <span className={styles.statValue}>{formatCurrency(overview.avgOrderValue.value)}</span>
              {overview.avgOrderValue.change !== 0 && (
                <span className={`${styles.statChange} ${overview.avgOrderValue.change >= 0 ? styles.positive : styles.negative}`}>
                  {overview.avgOrderValue.change >= 0 ? <ArrowUpRight size={14} strokeWidth={2} /> : <ArrowDownRight size={14} strokeWidth={2} />}
                  {Math.abs(overview.avgOrderValue.change)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Filter size={18} strokeWidth={1.5} />
            Conversion Funnel
          </h2>
          <div className={styles.funnelContainer}>
            <div className={styles.funnelSteps}>
              <div className={styles.funnelStep}>
                <div className={styles.funnelIcon}><Eye size={18} strokeWidth={1.5} /></div>
                <div className={styles.funnelInfo}>
                  <span className={styles.funnelValue}>{conversionFunnel.visitors?.toLocaleString()}</span>
                  <span className={styles.funnelLabel}>Visitors</span>
                </div>
              </div>
              <div className={styles.funnelArrow}>→</div>
              <div className={styles.funnelStep}>
                <div className={styles.funnelIcon}><Package size={18} strokeWidth={1.5} /></div>
                <div className={styles.funnelInfo}>
                  <span className={styles.funnelValue}>{conversionFunnel.productViews?.toLocaleString()}</span>
                  <span className={styles.funnelLabel}>Product Views</span>
                </div>
              </div>
              <div className={styles.funnelArrow}>→</div>
              <div className={styles.funnelStep}>
                <div className={styles.funnelIcon}><ShoppingCart size={18} strokeWidth={1.5} /></div>
                <div className={styles.funnelInfo}>
                  <span className={styles.funnelValue}>{conversionFunnel.addedToCart?.toLocaleString()}</span>
                  <span className={styles.funnelLabel}>Added to Cart</span>
                </div>
              </div>
              <div className={styles.funnelArrow}>→</div>
              <div className={styles.funnelStep}>
                <div className={styles.funnelIcon}><CreditCard size={18} strokeWidth={1.5} /></div>
                <div className={styles.funnelInfo}>
                  <span className={styles.funnelValue}>{conversionFunnel.checkout?.toLocaleString()}</span>
                  <span className={styles.funnelLabel}>Checkout</span>
                </div>
              </div>
              <div className={styles.funnelArrow}>→</div>
              <div className={`${styles.funnelStep} ${styles.funnelStepFinal}`}>
                <div className={styles.funnelIcon}><TrendingUp size={18} strokeWidth={1.5} /></div>
                <div className={styles.funnelInfo}>
                  <span className={styles.funnelValue}>{conversionFunnel.purchased}</span>
                  <span className={styles.funnelLabel}>Purchased</span>
                </div>
              </div>
            </div>
            <div className={styles.funnelRates}>
              <div className={styles.rateItem}>
                <span className={styles.rateLabel}>View → Cart</span>
                <span className={styles.rateValue}>{conversionFunnel.rates?.viewToCart}%</span>
              </div>
              <div className={styles.rateItem}>
                <span className={styles.rateLabel}>Cart → Checkout</span>
                <span className={styles.rateValue}>{conversionFunnel.rates?.cartToCheckout}%</span>
              </div>
              <div className={styles.rateItem}>
                <span className={styles.rateLabel}>Checkout → Purchase</span>
                <span className={styles.rateValue}>{conversionFunnel.rates?.checkoutToPurchase}%</span>
              </div>
              <div className={`${styles.rateItem} ${styles.rateItemHighlight}`}>
                <span className={styles.rateLabel}>Overall Conversion</span>
                <span className={styles.rateValue}>{conversionFunnel.rates?.overall}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className={styles.twoColumn}>
          {/* Revenue Chart */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Revenue (7 Days)</h2>
            <div className={styles.chartContainer}>
              {dailyRevenue?.map((day, index) => (
                <div key={index} className={styles.chartBar}>
                  <div className={styles.barWrapper}>
                    <div
                      className={styles.bar}
                      style={{ height: `${(day.revenue / getMaxRevenue()) * 100}%` }}
                    >
                      <span className={styles.barTooltip}>{formatCurrency(day.revenue)}</span>
                    </div>
                  </div>
                  <span className={styles.barLabel}>{day.date?.split(' ')[1]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <MousePointer size={18} strokeWidth={1.5} />
              Traffic Sources
            </h2>
            <div className={styles.trafficList}>
              {trafficSources?.map((source, index) => (
                <div key={index} className={styles.trafficItem}>
                  <div className={styles.trafficInfo}>
                    <span className={styles.trafficSource}>{source.source}</span>
                    <span className={styles.trafficMeta}>
                      {source.visitors?.toLocaleString()} visitors · {source.orders} orders
                    </span>
                  </div>
                  <div className={styles.trafficStats}>
                    <span className={styles.trafficRevenue}>{formatCurrency(source.revenue)}</span>
                    <div className={styles.trafficBar}>
                      <div 
                        className={styles.trafficBarFill}
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Three Column: Currency, Country, Customers */}
        <div className={styles.threeColumn}>
          {/* Revenue by Currency - Shows local currency amounts */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Revenue by Currency</h2>
            <div className={styles.currencyList}>
              {revenueByCurrency?.length > 0 ? revenueByCurrency.map((item, index) => (
                <div key={index} className={styles.currencyItem}>
                  <div className={styles.currencyInfo}>
                    <span className={styles.currencyFlag}>
                      {getCurrencyFlag(item.currency)}
                    </span>
                    <span className={styles.currencyCode}>{item.currency}</span>
                  </div>
                  <div className={styles.currencyStats}>
                    <span className={styles.currencyRevenue}>
                      {item.symbol}{Math.round(item.revenueLocal || 0).toLocaleString()}
                    </span>
                    <span className={styles.currencyUSD}>~{formatCurrency(item.revenueUSD)}</span>
                  </div>
                </div>
              )) : (
                <p className={styles.emptyText}>No currency data yet</p>
              )}
            </div>
          </div>

          {/* Revenue by Country */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Globe size={18} strokeWidth={1.5} />
              Top Countries
            </h2>
            <div className={styles.countryList}>
              {revenueByCountry?.length > 0 ? revenueByCountry.slice(0, 5).map((item, index) => (
                <div key={index} className={styles.countryItem}>
                  <div className={styles.countryInfo}>
                    <span className={styles.countryFlag}>
                      {getCountryFlag(item.flag)}
                    </span>
                    <span className={styles.countryName}>{item.country}</span>
                  </div>
                  <div className={styles.countryStats}>
                    <span className={styles.countryRevenue}>{formatCurrency(item.revenue)}</span>
                    <span className={styles.countryOrders}>{item.orders} orders</span>
                  </div>
                </div>
              )) : (
                <p className={styles.emptyText}>No country data yet</p>
              )}
            </div>
          </div>

          {/* Customer Acquisition */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <RefreshCw size={18} strokeWidth={1.5} />
              Customer Acquisition
            </h2>
            <div className={styles.acquisitionStats}>
              <div className={styles.acquisitionRow}>
                <div className={styles.acquisitionItem}>
                  <span className={styles.acquisitionValue}>{customerAcquisition?.newCustomers || 0}</span>
                  <span className={styles.acquisitionLabel}>New Customers</span>
                </div>
                <div className={styles.acquisitionItem}>
                  <span className={styles.acquisitionValue}>{customerAcquisition?.returningCustomers || 0}</span>
                  <span className={styles.acquisitionLabel}>Returning</span>
                </div>
              </div>
              <div className={styles.acquisitionMetric}>
                <span className={styles.acquisitionMetricLabel}>Repeat Purchase Rate</span>
                <span className={styles.acquisitionMetricValue}>{customerAcquisition?.repeatPurchaseRate || 0}%</span>
              </div>
              <div className={styles.acquisitionMetric}>
                <span className={styles.acquisitionMetricLabel}>Avg. Orders/Customer</span>
                <span className={styles.acquisitionMetricValue}>{customerAcquisition?.avgOrdersPerCustomer || 0}</span>
              </div>
              <div className={styles.acquisitionComparison}>
                <div className={styles.acquisitionCompareItem}>
                  <span className={styles.acquisitionCompareLabel}>New Customer Revenue</span>
                  <span className={styles.acquisitionCompareValue}>{formatCurrency(customerAcquisition?.newCustomerRevenue)}</span>
                </div>
                <div className={styles.acquisitionCompareItem}>
                  <span className={styles.acquisitionCompareLabel}>Returning Revenue</span>
                  <span className={`${styles.acquisitionCompareValue} ${styles.highlight}`}>{formatCurrency(customerAcquisition?.returningCustomerRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Top Products, Categories, Activity */}
        <div className={styles.threeColumn}>
          {/* Top Products */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Top Products</h2>
            <div className={styles.productList}>
              {topProducts?.map((product, index) => (
                <div key={index} className={styles.productItem}>
                  <span className={`${styles.productRank} ${index < 3 ? styles[`rank${index + 1}`] : ''}`}>
                    {index + 1}
                  </span>
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>{product.name}</span>
                    <span className={styles.productMeta}>{product.sales} sales</span>
                  </div>
                  <span className={styles.productRevenue}>{formatCurrency(product.revenue)}</span>
                </div>
              ))}
              {(!topProducts || topProducts.length === 0) && (
                <p className={styles.emptyText}>No sales data yet</p>
              )}
            </div>
          </div>

          {/* Sales by Category */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Sales by Category</h2>
            <div className={styles.categoryList}>
              {salesByCategory?.map((category, index) => (
                <div key={index} className={styles.categoryItem}>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categoryMeta}>{category.sales} sales</span>
                  </div>
                  <div className={styles.categoryStats}>
                    <span className={styles.categoryRevenue}>{formatCurrency(category.revenue)}</span>
                    <div className={styles.categoryBar}>
                      <div 
                        className={styles.categoryBarFill}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!salesByCategory || salesByCategory.length === 0) && (
                <p className={styles.emptyText}>No category data yet</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <div className={styles.activityList}>
              {recentActivity?.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <div className={`${styles.activityDot} ${styles[activity.type]}`} />
                  <div className={styles.activityInfo}>
                    <span className={styles.activityMessage}>{activity.message}</span>
                    <span className={styles.activityTime}>{activity.time}</span>
                  </div>
                  {activity.amount !== undefined && (
                    <span className={`${styles.activityAmount} ${activity.amount < 0 ? styles.negative : ''}`}>
                      {activity.amount > 0 ? '+' : ''}{formatCurrency(activity.amount)}
                    </span>
                  )}
                </div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <p className={styles.emptyText}>No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;