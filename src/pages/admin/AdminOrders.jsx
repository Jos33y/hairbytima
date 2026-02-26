// ==========================================================================
// Admin Orders Page - Enhanced with Payment Confirmation, Tracking, Timeline
// ==========================================================================

import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Download,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  X,
  CreditCard,
  AlertTriangle,
  Send,
  FileText,
  Image,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Printer,
  RefreshCw,
  Ban,
  Phone,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { AdminLayout } from '@components/admin';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminOrders.module.css';

// Format as USD for admin display (all values stored in USD)
const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const AdminOrders = () => {
  const { getAuthHeaders } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderCounts, setOrderCounts] = useState({
    all: 0, pending_payment: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0
  });
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  
  // Modal states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // Shipping form states
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  
  // Other form states
  const [newNote, setNewNote] = useState('');
  const [showPaymentProof, setShowPaymentProof] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Status options - awaiting_confirmation is a virtual status for orders with payment proof uploaded
  const statusOptions = ['all', 'pending_payment', 'awaiting_confirmation', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentOptions = ['all', 'pending', 'paid', 'refunded'];

  // Fetch orders from API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/orders?limit=100', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch orders');
      
      const data = await response.json();
      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
      setOrderCounts(data.orderCounts || {
        all: 0, pending_payment: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0
      });
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle URL parameters after orders are loaded
  useEffect(() => {
    if (!isLoading && !urlParamsProcessed) {
      processUrlParams();
      setUrlParamsProcessed(true);
    }
  }, [isLoading, orders, urlParamsProcessed]);

  // Check for /admin/orders/{id} route pattern
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // Check if last part looks like a UUID (order ID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(lastPart) && !isLoading && orders.length > 0) {
      const orderToView = orders.find(o => o.id === lastPart);
      if (orderToView) {
        handleViewOrder(orderToView);
      } else {
        // Order not in list, fetch it directly
        fetchAndOpenOrder(lastPart);
      }
      // Clear the ID from URL
      navigate('/admin/orders', { replace: true });
    }
  }, [location.pathname, isLoading, orders]);

  const fetchAndOpenOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.order) {
          setSelectedOrder(data.order);
          setCarrierName(data.order.carrier || '');
          setTrackingNumber(data.order.trackingNumber || '');
          setCourierPhone(data.order.courierPhone || '');
          setTrackingUrl(data.order.trackingUrl || '');
          setActiveTab('details');
          setShowOrderModal(true);
        }
      }
    } catch (err) {
      console.error('Fetch order error:', err);
    }
  };

  const processUrlParams = () => {
    // Handle status filter from URL
    const statusParam = searchParams.get('status');
    if (statusParam && statusOptions.includes(statusParam)) {
      setStatusFilter(statusParam);
    }

    // Handle payment filter from URL
    const paymentParam = searchParams.get('payment');
    if (paymentParam && paymentOptions.includes(paymentParam)) {
      setPaymentFilter(paymentParam);
    }

    // Handle highlight (open order modal)
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      const orderToView = orders.find(o => o.id === highlightId);
      if (orderToView) {
        handleViewOrder(orderToView);
      } else {
        // Order not in current list, fetch it directly
        fetchAndOpenOrder(highlightId);
      }
      // Clear highlight param after processing
      searchParams.delete('highlight');
      setSearchParams(searchParams, { replace: true });
    }
  };

  // Filter orders locally
  useEffect(() => {
    let result = orders;

    if (statusFilter === 'awaiting_confirmation') {
      // Virtual status: pending_payment orders WITH payment proof uploaded
      result = result.filter(order => order.status === 'pending_payment' && order.paymentProof);
    } else if (statusFilter === 'pending_payment') {
      // Only pending_payment orders WITHOUT payment proof
      result = result.filter(order => order.status === 'pending_payment' && !order.paymentProof);
    } else if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      result = result.filter(order => order.paymentStatus === paymentFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.orderNumber?.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.customer?.email?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(result);
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_payment': return Clock;
      case 'processing': return Package;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending_payment': return styles.statusPending;
      case 'processing': return styles.statusProcessing;
      case 'shipped': return styles.statusShipped;
      case 'delivered': return styles.statusDelivered;
      case 'cancelled': return styles.statusCancelled;
      default: return '';
    }
  };

  const getPaymentClass = (status) => {
    switch (status) {
      case 'pending': return styles.paymentPending;
      case 'paid': return styles.paymentPaid;
      case 'refunded': return styles.paymentRefunded;
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateFull = (dateString) => {
    if (!dateString) return '-';
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

  const handleViewOrder = async (order) => {
    // Set initial order data and reset form fields
    setSelectedOrder(order);
    setCarrierName(order.carrier || '');
    setTrackingNumber(order.trackingNumber || '');
    setCourierPhone(order.courierPhone || '');
    setTrackingUrl(order.trackingUrl || '');
    setActiveTab('details');
    setShowOrderModal(true);
    
    // Fetch full order details including timeline
    try {
      const response = await fetch(`/api/admin/orders?id=${order.id}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.order);
        // Update form fields with fetched data
        setCarrierName(data.order.carrier || '');
        setTrackingNumber(data.order.trackingNumber || '');
        setCourierPhone(data.order.courierPhone || '');
        setTrackingUrl(data.order.trackingUrl || '');
      }
    } catch (err) {
      console.error('Fetch order details error:', err);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ action: 'confirm_payment' }),
      });

      if (response.ok) {
        await fetchOrders();
        setSelectedOrder(prev => prev ? { ...prev, paymentStatus: 'paid', status: 'processing' } : null);
      }
    } catch (err) {
      console.error('Confirm payment error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectPayment = async (orderId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ 
          action: 'reject_payment',
          rejection_reason: reason || 'Payment proof could not be verified. Please upload a new proof of payment.',
        }),
      });

      if (response.ok) {
        await fetchOrders();
        setSelectedOrder(prev => prev ? { ...prev, paymentProof: null, paymentStatus: 'rejected' } : null);
      }
    } catch (err) {
      console.error('Reject payment error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShipOrder = async (orderId) => {
    // Only carrier name is required
    if (!carrierName.trim()) {
      alert('Please enter carrier/courier name');
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ 
          action: 'ship',
          carrier: carrierName.trim(),
          tracking_number: trackingNumber.trim() || null,
          courier_phone: courierPhone.trim() || null,
          tracking_url: trackingUrl.trim() || null,
        }),
      });

      if (response.ok) {
        await fetchOrders();
        setSelectedOrder(prev => prev ? { 
          ...prev, 
          status: 'shipped', 
          carrier: carrierName.trim(),
          trackingNumber: trackingNumber.trim() || null,
          courierPhone: courierPhone.trim() || null,
          trackingUrl: trackingUrl.trim() || null,
        } : null);
      }
    } catch (err) {
      console.error('Ship order error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ action: 'mark_delivered' }),
      });

      if (response.ok) {
        await fetchOrders();
        setSelectedOrder(prev => prev ? { ...prev, status: 'delivered' } : null);
      }
    } catch (err) {
      console.error('Mark delivered error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored.')) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (response.ok) {
        await fetchOrders();
        setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (err) {
      console.error('Cancel order error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedOrder) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders?id=${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ action: 'add_note', note: newNote }),
      });

      if (response.ok) {
        // Refresh order details
        const detailsResponse = await fetch(`/api/admin/orders?id=${selectedOrder.id}`, {
          headers: getAuthHeaders(),
        });
        if (detailsResponse.ok) {
          const data = await detailsResponse.json();
          setSelectedOrder(data.order);
        }
        setNewNote('');
      }
    } catch (err) {
      console.error('Add note error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendShippedEmail = async () => {
    if (!selectedOrder) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders?id=${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ action: 'resend_shipped_email' }),
      });

      if (response.ok) {
        alert('Shipping notification email sent!');
      }
    } catch (err) {
      console.error('Send email error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    // TODO: Implement invoice printing
    alert('Invoice printing coming soon');
  };

  const handleExportOrders = () => {
    // TODO: Implement CSV export
    alert('Export feature coming soon');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Orders</h1>
            <p className={styles.subtitle}>{orderCounts.all} total orders</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryBtn} onClick={fetchOrders}>
              <RefreshCw size={16} strokeWidth={1.5} />
              Refresh
            </button>
            <button className={styles.secondaryBtn} onClick={handleExportOrders}>
              <Download size={16} strokeWidth={1.5} />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} strokeWidth={1.5} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.statusTabs}>
            {statusOptions.map(status => {
              // Get correct count for each status
              const getCount = () => {
                if (status === 'awaiting_confirmation') return orderCounts.awaitingConfirmation || 0;
                if (status === 'pending_payment') {
                  // Pending payment WITHOUT proof = total pending - awaiting confirmation
                  return (orderCounts.pending_payment || 0) - (orderCounts.awaitingConfirmation || 0);
                }
                return orderCounts[status] || 0;
              };
              
              // Get display label
              const getLabel = () => {
                if (status === 'all') return 'All';
                if (status === 'awaiting_confirmation') return 'Awaiting Confirmation';
                return status.replace('_', ' ');
              };
              
              return (
                <button
                  key={status}
                  className={`${styles.statusTab} ${statusFilter === status ? styles.statusTabActive : ''} ${status === 'awaiting_confirmation' ? styles.statusTabAwaiting : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  <span className={styles.statusTabLabel}>
                    {getLabel()}
                  </span>
                  <span className={styles.statusTabCount}>
                    {getCount()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Table */}
        <div className={styles.tableWrapper}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className={styles.empty}>
              <Package size={48} strokeWidth={1} />
              <p>No orders found</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const StatusIcon = getStatusIcon(order.status);
                  return (
                    <tr key={order.id}>
                      <td>
                        <div className={styles.orderCell}>
                          <span className={styles.orderNumber}>{order.orderNumber}</span>
                          <div className={styles.orderMeta}>
                            {order.paymentMethod === 'bank_transfer' && order.paymentProof && (
                              <span className={styles.proofDot} title="Payment proof uploaded" />
                            )}
                            <span>{order.paymentMethod === 'bank_transfer' ? 'Bank' : 'Klarna'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.customerCell}>
                          <span className={styles.customerName}>{order.customer?.name || '-'}</span>
                          <span className={styles.customerEmail}>{order.customer?.email || '-'}</span>
                        </div>
                      </td>
                      <td>{order.itemCount || order.items?.length || 0}</td>
                      <td>
                        <div className={styles.totalCell}>
                          <span className={styles.totalAmount}>{formatUSD(order.total)}</span>
                          <span className={`${styles.paymentDot} ${order.paymentStatus}`} 
                                title={`Payment: ${order.paymentStatus}`} />
                        </div>
                      </td>
                      <td>
                        {/* Show "Awaiting Confirmation" if payment proof uploaded but not yet confirmed */}
                        {order.status === 'pending_payment' && order.paymentProof ? (
                          <span className={`${styles.statusPill} ${styles.statusAwaitingConfirmation}`}>
                            awaiting confirmation
                          </span>
                        ) : (
                          <span className={`${styles.statusPill} ${getStatusClass(order.status)}`}>
                            {order.status?.replace('_', ' ') || '-'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={styles.date}>{formatDate(order.createdAt)}</span>
                      </td>
                      <td>
                        <button 
                          className={styles.viewBtn} 
                          onClick={() => handleViewOrder(order)}
                          title="View order"
                        >
                          <Eye size={18} strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Order Modal */}
        {showOrderModal && selectedOrder && (
          <>
            <div className={styles.modalOverlay} onClick={() => setShowOrderModal(false)} />
            <div className={styles.modal}>
              {/* Modal Header */}
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>
                  <h2>Order {selectedOrder.orderNumber}</h2>
                  <span className={styles.modalDate}>{formatDateFull(selectedOrder.createdAt)}</span>
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.iconBtn} onClick={handlePrintInvoice} title="Print Invoice">
                    <Printer size={18} strokeWidth={1.5} />
                  </button>
                  <button className={styles.modalClose} onClick={() => setShowOrderModal(false)}>
                    <X size={24} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className={styles.modalTabs}>
                <button 
                  className={`${styles.modalTab} ${activeTab === 'details' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </button>
                <button 
                  className={`${styles.modalTab} ${activeTab === 'timeline' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveTab('timeline')}
                >
                  Timeline
                </button>
                <button 
                  className={`${styles.modalTab} ${activeTab === 'notes' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  Notes ({selectedOrder.notes?.length || 0})
                </button>
              </div>

              <div className={styles.modalBody}>
                {activeTab === 'details' && (
                  <>
                    {/* Status & Actions Bar */}
                    <div className={styles.actionBar}>
                      <div className={styles.currentStatus}>
                        <span className={`${styles.statusBadgeLarge} ${getStatusClass(selectedOrder.status)}`}>
                          {selectedOrder.status?.replace('_', ' ') || '-'}
                        </span>
                        <span className={`${styles.paymentBadge} ${getPaymentClass(selectedOrder.paymentStatus)}`}>
                          Payment: {selectedOrder.paymentStatus || '-'}
                        </span>
                      </div>
                      
                      <div className={styles.actionButtons}>
                        {selectedOrder.status === 'pending_payment' && selectedOrder.paymentProof && (
                          <>
                            <button 
                              className={styles.successBtn} 
                              onClick={() => handleConfirmPayment(selectedOrder.id)}
                              disabled={isUpdating}
                            >
                              <CheckCircle size={16} strokeWidth={1.5} />
                              Confirm Payment
                            </button>
                            <button 
                              className={styles.dangerBtn} 
                              onClick={() => handleRejectPayment(selectedOrder.id)}
                              disabled={isUpdating}
                            >
                              <XCircle size={16} strokeWidth={1.5} />
                              Reject
                            </button>
                          </>
                        )}
                        {selectedOrder.status === 'shipped' && (
                          <>
                            <button 
                              className={styles.primaryBtn} 
                              onClick={handleSendShippedEmail}
                              disabled={isUpdating}
                            >
                              <Send size={16} strokeWidth={1.5} />
                              Resend Email
                            </button>
                            <button 
                              className={styles.successBtn} 
                              onClick={() => handleMarkDelivered(selectedOrder.id)}
                              disabled={isUpdating}
                            >
                              <CheckCircle size={16} strokeWidth={1.5} />
                              Mark Delivered
                            </button>
                          </>
                        )}
                        {['pending_payment', 'processing'].includes(selectedOrder.status) && (
                          <button 
                            className={styles.dangerOutlineBtn} 
                            onClick={() => handleCancelOrder(selectedOrder.id)}
                            disabled={isUpdating}
                          >
                            <Ban size={16} strokeWidth={1.5} />
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Payment Proof Section */}
                    {selectedOrder.paymentMethod === 'bank_transfer' && (
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                          <CreditCard size={18} strokeWidth={1.5} />
                          Payment Proof
                        </h3>
                        {selectedOrder.paymentProof ? (
                          <div className={styles.paymentProofCard}>
                            <div 
                              className={styles.paymentProofPreview}
                              onClick={() => setShowPaymentProof(true)}
                            >
                              {selectedOrder.paymentProof.type === 'image' ? (
                                <img src={selectedOrder.paymentProof.url} alt="Payment proof" />
                              ) : (
                                <div className={styles.pdfPreview}>
                                  <FileText size={32} strokeWidth={1} />
                                  <span>PDF Document</span>
                                </div>
                              )}
                              <div className={styles.proofOverlay}>
                                <Eye size={24} strokeWidth={1.5} />
                                <span>Click to view</span>
                              </div>
                            </div>
                            <div className={styles.proofInfo}>
                              <p>Uploaded: {formatDateFull(selectedOrder.paymentProof.uploadedAt)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.noProof}>
                            <AlertTriangle size={24} strokeWidth={1.5} />
                            <p>No payment proof uploaded yet</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ship Order Form (only for processing status) */}
                    {selectedOrder.status === 'processing' && (
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                          <Truck size={18} strokeWidth={1.5} />
                          Ship Order
                        </h3>
                        <div className={styles.shippingForm}>
                          {/* Row 1: Carrier & Tracking Number */}
                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label>Carrier / Courier Name *</label>
                              <input
                                type="text"
                                value={carrierName}
                                onChange={(e) => setCarrierName(e.target.value)}
                                placeholder="e.g. DHL, FedEx, GIG Logistics"
                                className={styles.formInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Tracking Number</label>
                              <input
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Optional"
                                className={styles.formInput}
                              />
                            </div>
                          </div>
                          
                          {/* Row 2: Courier Phone & Tracking URL */}
                          <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label>Courier Phone</label>
                              <input
                                type="tel"
                                value={courierPhone}
                                onChange={(e) => setCourierPhone(e.target.value)}
                                placeholder="For local delivery"
                                className={styles.formInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Tracking URL</label>
                              <input
                                type="url"
                                value={trackingUrl}
                                onChange={(e) => setTrackingUrl(e.target.value)}
                                placeholder="Full tracking link"
                                className={styles.formInput}
                              />
                            </div>
                          </div>

                          <p className={styles.formHint}>
                            Only carrier name is required. Add phone for local couriers, URL for online tracking.
                          </p>
                          
                          <button 
                            className={styles.primaryBtn}
                            onClick={() => handleShipOrder(selectedOrder.id)}
                            disabled={!carrierName.trim() || isUpdating}
                          >
                            <Truck size={16} strokeWidth={1.5} />
                            {isUpdating ? 'Processing...' : 'Mark as Shipped & Send Email'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tracking Info (if shipped) */}
                    {(selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') && selectedOrder.carrier && (
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                          <Truck size={18} strokeWidth={1.5} />
                          Shipping Information
                        </h3>
                        <div className={styles.trackingInfoCard}>
                          <div className={styles.trackingRow}>
                            <span className={styles.trackingLabel}>Carrier</span>
                            <span className={styles.trackingValue}>{selectedOrder.carrier}</span>
                          </div>
                          
                          {selectedOrder.trackingNumber && (
                            <div className={styles.trackingRow}>
                              <span className={styles.trackingLabel}>Tracking Number</span>
                              <div className={styles.trackingValueWithAction}>
                                <span className={styles.trackingValue}>{selectedOrder.trackingNumber}</span>
                                <button 
                                  className={styles.copySmallBtn}
                                  onClick={() => copyToClipboard(selectedOrder.trackingNumber)}
                                >
                                  {copied ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {selectedOrder.courierPhone && (
                            <div className={styles.trackingRow}>
                              <span className={styles.trackingLabel}>Courier Phone</span>
                              <a href={`tel:${selectedOrder.courierPhone}`} className={styles.trackingLink}>
                                <Phone size={14} />
                                {selectedOrder.courierPhone}
                              </a>
                            </div>
                          )}
                          
                          {selectedOrder.trackingUrl && (
                            <div className={styles.trackingRow}>
                              <span className={styles.trackingLabel}>Tracking Link</span>
                              <a 
                                href={selectedOrder.trackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={styles.trackingLink}
                              >
                                <ExternalLink size={14} />
                                Open Tracking
                              </a>
                            </div>
                          )}
                          
                          {selectedOrder.shippedAt && (
                            <div className={styles.trackingRow}>
                              <span className={styles.trackingLabel}>Shipped</span>
                              <span className={styles.trackingValue}>{formatDateFull(selectedOrder.shippedAt)}</span>
                            </div>
                          )}
                          
                          {selectedOrder.deliveredAt && (
                            <div className={styles.trackingRow}>
                              <span className={styles.trackingLabel}>Delivered</span>
                              <span className={styles.trackingValue}>{formatDateFull(selectedOrder.deliveredAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>
                        <Package size={18} strokeWidth={1.5} />
                        Order Items
                      </h3>
                      <div className={styles.itemsList}>
                        {selectedOrder.items?.map(item => (
                          <div key={item.id} className={styles.orderItem}>
                            <div className={styles.itemInfo}>
                              <span className={styles.itemName}>{item.name}</span>
                              <span className={styles.itemMeta}>
                                {item.length} · SKU: {item.sku || '-'} · Qty: {item.quantity}
                              </span>
                            </div>
                            <span className={styles.itemPrice}>
                              {formatUSD(item.price * item.quantity)}
                            </span>
                          </div>
                        )) || (
                          <p className={styles.noItems}>No items</p>
                        )}
                      </div>
                      <div className={styles.orderTotals}>
                        <div className={styles.totalRow}>
                          <span>Subtotal</span>
                          <span>{formatUSD(selectedOrder.subtotal)}</span>
                        </div>
                        {selectedOrder.discount > 0 && (
                          <div className={styles.totalRow}>
                            <span>Discount ({selectedOrder.discountCode})</span>
                            <span className={styles.discountAmount}>-{formatUSD(selectedOrder.discount)}</span>
                          </div>
                        )}
                        <div className={styles.totalRow}>
                          <span>Shipping</span>
                          <span>{selectedOrder.shipping === 0 ? 'Free' : formatUSD(selectedOrder.shipping)}</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.totalRowFinal}`}>
                          <span>Total</span>
                          <span>{formatUSD(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer & Shipping */}
                    <div className={styles.twoColumn}>
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Customer</h3>
                        <div className={styles.infoCard}>
                          <p className={styles.infoName}>{selectedOrder.customer?.name || '-'}</p>
                          <p>{selectedOrder.customer?.email || '-'}</p>
                          <p>{selectedOrder.customer?.phone || '-'}</p>
                        </div>
                      </div>
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Shipping Address</h3>
                        <div className={styles.infoCard}>
                          <p>{selectedOrder.shippingAddress?.address || '-'}</p>
                          {selectedOrder.shippingAddress?.apartment && (
                            <p>{selectedOrder.shippingAddress.apartment}</p>
                          )}
                          <p>
                            {selectedOrder.shippingAddress?.city || '-'}
                            {selectedOrder.shippingAddress?.state && `, ${selectedOrder.shippingAddress.state}`}
                            {selectedOrder.shippingAddress?.postalCode && ` ${selectedOrder.shippingAddress.postalCode}`}
                          </p>
                          <p>{selectedOrder.shippingAddress?.country || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Notes (if any) */}
                    {selectedOrder.customerNotes && (
                      <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                          <MessageSquare size={18} strokeWidth={1.5} />
                          Customer Notes
                        </h3>
                        <div className={styles.customerNotesCard}>
                          <p>{selectedOrder.customerNotes}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'timeline' && (
                  <div className={styles.timeline}>
                    {selectedOrder.timeline?.length > 0 ? (
                      selectedOrder.timeline.slice().reverse().map((event, index) => (
                        <div key={index} className={styles.timelineItem}>
                          <div className={styles.timelineDot} />
                          <div className={styles.timelineContent}>
                            <p className={styles.timelineAction}>{event.action}</p>
                            {event.details && (
                              <p className={styles.timelineDetails}>{event.details}</p>
                            )}
                            <p className={styles.timelineMeta}>
                              {formatDateFull(event.timestamp)} · {event.by}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noTimeline}>
                        <Clock size={32} strokeWidth={1} />
                        <p>No timeline events yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className={styles.notesSection}>
                    <div className={styles.addNote}>
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add an internal note..."
                        className={styles.noteInput}
                        rows={3}
                      />
                      <button 
                        className={styles.primaryBtn}
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || isUpdating}
                      >
                        <MessageSquare size={16} strokeWidth={1.5} />
                        Add Note
                      </button>
                    </div>
                    
                    {(!selectedOrder.notes || selectedOrder.notes.length === 0) ? (
                      <div className={styles.noNotes}>
                        <MessageSquare size={32} strokeWidth={1} />
                        <p>No notes yet</p>
                      </div>
                    ) : (
                      <div className={styles.notesList}>
                        {selectedOrder.notes.slice().reverse().map((note, index) => (
                          <div key={index} className={styles.noteItem}>
                            <p className={styles.noteText}>{note.text}</p>
                            <p className={styles.noteMeta}>
                              {note.by} · {formatDateFull(note.timestamp)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Payment Proof Lightbox */}
        {showPaymentProof && selectedOrder?.paymentProof && (
          <div className={styles.lightbox} onClick={() => setShowPaymentProof(false)}>
            <button className={styles.lightboxClose}>
              <X size={32} strokeWidth={1.5} />
            </button>
            {selectedOrder.paymentProof.type === 'image' ? (
              <img 
                src={selectedOrder.paymentProof.url} 
                alt="Payment proof" 
                className={styles.lightboxImage}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <iframe 
                src={selectedOrder.paymentProof.url}
                className={styles.lightboxPdf}
                title="Payment proof PDF"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;