// ==========================================================================
// Admin Customers Page - Customer Management with Order & Coupon History
// ==========================================================================

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Download,
  Eye,
  Users,
  X,
  ShoppingBag,
  Ticket,
  Calendar,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Flag,
  ExternalLink
} from 'lucide-react';
import { AdminLayout } from '@components/admin';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminCustomers.module.css'; 

// Format as USD for admin display (all values stored in USD)
const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const AdminCustomers = () => {
  const { getAuthHeaders } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [sortOrder, setSortOrder] = useState('desc');
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch customers
  const fetchCustomers = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/customers?limit=100', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const data = await response.json();
      setCustomers(data.customers || []);
      setFilteredCustomers(data.customers || []);
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Process URL parameters after customers are loaded
  useEffect(() => {
    if (!isLoading && customers.length > 0 && !urlParamsProcessed) {
      processUrlParams();
      setUrlParamsProcessed(true);
    }
  }, [isLoading, customers, urlParamsProcessed]);

  const processUrlParams = () => {
    // Handle search from URL
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    // Handle highlight (open customer modal)
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      const customerToView = customers.find(c => c.id === highlightId);
      if (customerToView) {
        handleViewCustomer(customerToView);
      } else {
        // Customer not in current list, fetch directly
        fetchAndOpenCustomer(highlightId);
      }
      // Clear highlight param after processing
      searchParams.delete('highlight');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const fetchAndOpenCustomer = async (customerId) => {
    try {
      const response = await fetch(`/api/admin/customers?id=${customerId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.customer) {
          setSelectedCustomer(data.customer);
          setActiveTab('overview');
          setShowCustomerModal(true);
        }
      }
    } catch (err) {
      console.error('Fetch customer error:', err);
    }
  };

  // Filter and sort customers
  useEffect(() => {
    let result = [...customers];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(customer => 
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query) ||
        customer.city?.toLowerCase().includes(query) ||
        customer.country?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'totalSpent':
          comparison = (a.totalSpent || 0) - (b.totalSpent || 0);
          break;
        case 'totalOrders':
          comparison = (a.totalOrders || 0) - (b.totalOrders || 0);
          break;
        case 'lastOrder':
          comparison = new Date(a.lastOrderDate || 0) - new Date(b.lastOrderDate || 0);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredCustomers(result);
  }, [customers, searchQuery, sortBy, sortOrder]);

  // Stats
  const stats = {
    total: customers.length,
    newThisMonth: customers.filter(c => {
      const created = new Date(c.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    couponUsers: customers.filter(c => c.couponsUsed?.length > 0).length,
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateFull = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStatusClass = (status, hasPaymentProof = false) => {
    // Awaiting confirmation = pending_payment + has payment proof
    if (status === 'pending_payment' && hasPaymentProof) {
      return styles.statusAwaitingConfirmation;
    }
    switch (status) {
      case 'pending_payment': return styles.statusPending;
      case 'processing': return styles.statusProcessing;
      case 'shipped': return styles.statusShipped;
      case 'delivered': return styles.statusDelivered;
      case 'cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  const getOrderStatusLabel = (status, hasPaymentProof = false) => {
    if (status === 'pending_payment' && hasPaymentProof) {
      return 'awaiting confirmation';
    }
    return status?.replace(/_/g, ' ') || '';
  };

  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('overview');
    setShowCustomerModal(true);
    
    // Fetch full customer details
    try {
      const response = await fetch(`/api/admin/customers?id=${customer.id}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data.customer);
      }
    } catch (err) {
      console.error('Fetch customer details error:', err);
    }
  };

  const handleFlagCustomer = async (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    const currentFlagged = customer?.isFlagged;
    
    try {
      const response = await fetch(`/api/admin/customers?id=${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ 
          is_flagged: !currentFlagged,
          flag_reason: !currentFlagged ? 'Flagged by admin' : null,
        }),
      });

      if (response.ok) {
        await fetchCustomers();
      }
    } catch (err) {
      console.error('Toggle flag error:', err);
    }
  };

  const handleExportCustomers = () => {
    const headers = ['Name', 'Email', 'Phone', 'Location', 'Total Orders', 'Total Spent (USD)', 'Coupons Used', 'Total Saved (USD)', 'Last Order'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.email,
      c.phone || '',
      [c.city, c.country].filter(Boolean).join(', '),
      c.totalOrders,
      c.totalSpent,
      c.couponsUsed?.length || 0,
      c.totalSaved || 0,
      c.lastOrderDate ? formatDate(c.lastOrderDate) : 'N/A',
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Customers" isLoading={isLoading}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Customers</h1>
            <p className={styles.subtitle}>{customers.length} total customers</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryBtn} onClick={handleExportCustomers}>
              <Download size={18} strokeWidth={1.5} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <Users size={20} strokeWidth={1.5} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>Total Customers</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={20} strokeWidth={1.5} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.newThisMonth}</span>
              <span className={styles.statLabel}>New This Month</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <ShoppingBag size={20} strokeWidth={1.5} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{formatUSD(stats.totalRevenue)}</span>
              <span className={styles.statLabel}>Total Revenue</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <Ticket size={20} strokeWidth={1.5} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.couponUsers}</span>
              <span className={styles.statLabel}>Coupon Users</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} strokeWidth={1.5} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.sortWrapper}>
            <span className={styles.sortLabel}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.select}
            >
              <option value="totalSpent">Total Spent</option>
              <option value="totalOrders">Total Orders</option>
              <option value="lastOrder">Last Order</option>
              <option value="name">Name</option>
            </select>
            <button 
              className={styles.sortOrderBtn}
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className={styles.tableWrapper}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className={styles.empty}>
              <Users size={48} strokeWidth={1} />
              <p>No customers found</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Coupons Used</th>
                  <th>Last Order</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className={customer.isFlagged ? styles.rowFlagged : ''}>
                    <td>
                      <div className={styles.customerCell}>
                        <div className={styles.customerAvatar}>
                          {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className={styles.customerInfo}>
                          <span className={styles.customerName}>
                            {customer.name || 'Unknown'}
                            {customer.isFlagged && (
                              <Flag size={12} strokeWidth={1.5} className={styles.flagIcon} />
                            )}
                          </span>
                          <span className={styles.customerEmail}>{customer.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.location}>
                        {[customer.city, customer.country].filter(Boolean).join(', ') || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.orderCount}>{customer.totalOrders || 0}</span>
                    </td>
                    <td>
                      <span className={styles.totalSpent}>{formatUSD(customer.totalSpent || 0)}</span>
                    </td>
                    <td>
                      <span className={styles.couponCount}>
                        {customer.couponsUsed?.length > 0 ? (
                          <>
                            {customer.couponsUsed.length}
                            <span className={styles.savedAmount}>
                              (saved {formatUSD(customer.totalSaved || 0)})
                            </span>
                          </>
                        ) : (
                          <span className={styles.noCoupons}>None</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={styles.date}>{formatDate(customer.lastOrderDate)}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={styles.actionBtn}
                          onClick={() => handleViewCustomer(customer)}
                          title="View details"
                        >
                          <Eye size={18} strokeWidth={1.5} />
                        </button>
                        <button 
                          className={`${styles.actionBtn} ${customer.isFlagged ? styles.flagged : ''}`}
                          onClick={() => handleFlagCustomer(customer.id)}
                          title={customer.isFlagged ? 'Remove flag' : 'Flag customer'}
                        >
                          <Flag size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Customer Detail Modal */}
        {showCustomerModal && selectedCustomer && (
          <>
            <div className={styles.modalBackdrop} onClick={() => setShowCustomerModal(false)} />
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div className={styles.modalCustomerHeader}>
                  <div className={styles.modalAvatar}>
                    {selectedCustomer.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h2 className={styles.modalTitle}>{selectedCustomer.name || 'Unknown'}</h2>
                    <p className={styles.modalSubtitle}>Customer since {formatDate(selectedCustomer.firstOrderDate || selectedCustomer.createdAt)}</p>
                  </div>
                </div>
                <button className={styles.modalClose} onClick={() => setShowCustomerModal(false)}>
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className={styles.modalTabs}>
                <button 
                  className={`${styles.modalTab} ${activeTab === 'overview' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`${styles.modalTab} ${activeTab === 'orders' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  Orders ({selectedCustomer.orders?.length || selectedCustomer.totalOrders || 0})
                </button>
                <button 
                  className={`${styles.modalTab} ${activeTab === 'coupons' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveTab('coupons')}
                >
                  Coupons ({selectedCustomer.couponsUsed?.length || 0})
                </button>
              </div>

              <div className={styles.modalBody}>
                {activeTab === 'overview' && (
                  <>
                    {/* Contact Info */}
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Contact Information</h3>
                      <div className={styles.contactGrid}>
                        <div className={styles.contactItem}>
                          <Mail size={16} strokeWidth={1.5} />
                          <span>{selectedCustomer.email}</span>
                        </div>
                        {selectedCustomer.phone && (
                          <div className={styles.contactItem}>
                            <Phone size={16} strokeWidth={1.5} />
                            <span>{selectedCustomer.phone}</span>
                          </div>
                        )}
                        {(selectedCustomer.city || selectedCustomer.country) && (
                          <div className={styles.contactItem}>
                            <MapPin size={16} strokeWidth={1.5} />
                            <span>{[selectedCustomer.city, selectedCustomer.country].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Customer Stats</h3>
                      <div className={styles.statsGrid}>
                        <div className={styles.statBox}>
                          <span className={styles.statBoxValue}>{selectedCustomer.totalOrders || 0}</span>
                          <span className={styles.statBoxLabel}>Total Orders</span>
                        </div>
                        <div className={styles.statBox}>
                          <span className={styles.statBoxValue}>{formatUSD(selectedCustomer.totalSpent || 0)}</span>
                          <span className={styles.statBoxLabel}>Total Spent</span>
                        </div>
                        <div className={styles.statBox}>
                          <span className={styles.statBoxValue}>{formatUSD(selectedCustomer.averageOrderValue || 0)}</span>
                          <span className={styles.statBoxLabel}>Avg. Order Value</span>
                        </div>
                        <div className={styles.statBox}>
                          <span className={styles.statBoxValue}>{formatUSD(selectedCustomer.totalSaved || 0)}</span>
                          <span className={styles.statBoxLabel}>Total Saved</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders Preview */}
                    {selectedCustomer.orders?.length > 0 && (
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Recent Orders</h3>
                        <div className={styles.recentOrders}>
                          {selectedCustomer.orders.slice(0, 3).map(order => (
                            <Link 
                              key={order.id} 
                              to={`/admin/orders?highlight=${order.orderId}`}
                              className={styles.recentOrderItem}
                              onClick={() => setShowCustomerModal(false)}
                            >
                              <div className={styles.orderInfo}>
                                <span className={styles.orderId}>{order.id}</span>
                                <span className={styles.orderDate}>{formatDate(order.date)}</span>
                              </div>
                              <div className={styles.orderMeta}>
                                <span className={`${styles.orderStatus} ${getOrderStatusClass(order.status, order.hasPaymentProof)}`}>
                                  {getOrderStatusLabel(order.status, order.hasPaymentProof)}
                                </span>
                                <span className={styles.orderTotal}>{formatUSD(order.total)}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                        {selectedCustomer.orders.length > 3 && (
                          <button 
                            className={styles.viewAllBtn}
                            onClick={() => setActiveTab('orders')}
                          >
                            View all {selectedCustomer.orders.length} orders
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'orders' && (
                  <div className={styles.ordersList}>
                    {!selectedCustomer.orders?.length ? (
                      <div className={styles.emptyState}>
                        <ShoppingBag size={32} strokeWidth={1} />
                        <p>No orders yet</p>
                      </div>
                    ) : (
                      selectedCustomer.orders.map(order => (
                        <div key={order.id} className={styles.orderCard}>
                          <div className={styles.orderCardHeader}>
                            <span className={styles.orderId}>{order.id}</span>
                            <span className={`${styles.orderStatus} ${getOrderStatusClass(order.status, order.hasPaymentProof)}`}>
                              {getOrderStatusLabel(order.status, order.hasPaymentProof)}
                            </span>
                          </div>
                          <div className={styles.orderCardBody}>
                            <div className={styles.orderDetail}>
                              <Calendar size={14} strokeWidth={1.5} />
                              <span>{formatDateFull(order.date)}</span>
                            </div>
                            {order.items > 0 && (
                              <div className={styles.orderDetail}>
                                <ShoppingBag size={14} strokeWidth={1.5} />
                                <span>{order.items} items</span>
                              </div>
                            )}
                          </div>
                          <div className={styles.orderCardFooter}>
                            <span className={styles.orderTotal}>{formatUSD(order.total)}</span>
                            <Link 
                              to={`/admin/orders?highlight=${order.orderId}`}
                              className={styles.viewOrderLink}
                              onClick={() => setShowCustomerModal(false)}
                            >
                              View Order
                              <ExternalLink size={12} strokeWidth={1.5} />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'coupons' && (
                  <div className={styles.couponsList}>
                    {!selectedCustomer.couponsUsed?.length ? (
                      <div className={styles.emptyState}>
                        <Ticket size={32} strokeWidth={1} />
                        <p>No coupons used</p>
                      </div>
                    ) : (
                      <>
                        <div className={styles.couponSummary}>
                          <p>Total coupons used: <strong>{selectedCustomer.couponsUsed.length}</strong></p>
                          <p>Total saved: <strong className={styles.savedHighlight}>{formatUSD(selectedCustomer.totalSaved || 0)}</strong></p>
                        </div>
                        {selectedCustomer.couponsUsed.map((coupon, index) => (
                          <div key={index} className={styles.couponCard}>
                            <div className={styles.couponCode}>{coupon.code}</div>
                            <div className={styles.couponDetails}>
                              <span>{formatDate(coupon.usedAt)}</span>
                            </div>
                            <div className={styles.couponDiscount}>
                              -{formatUSD(coupon.discount)}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;