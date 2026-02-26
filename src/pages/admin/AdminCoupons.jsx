// ==========================================================================
// Admin Coupons Page - Enhanced with Usage Analytics
// ==========================================================================

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus,
  Edit2,
  Trash2,
  Ticket,
  X,
  Percent,
  DollarSign,
  Truck,
  Copy,
  Check,
  Eye,
  TrendingUp,
  Users,
  ShoppingBag,
  Calendar
} from 'lucide-react';
import { AdminLayout } from '@components/admin';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminCoupons.module.css';

// Format as USD for admin display (all values stored in USD)
const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const AdminCoupons = () => {
  const { getAuthHeaders } = useAuthStore();
  
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxUses: '',
    isSingleUse: false,
    startsAt: '',
    expiresAt: '',
    isActive: true,
  });

  // Fetch coupons
  const fetchCoupons = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/coupons', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch coupons');
      }
      
      const data = await response.json();
      setCoupons(data.coupons || []);
      setFilteredCoupons(data.coupons || []);
    } catch (err) {
      console.error('Fetch coupons error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Filter coupons
  useEffect(() => {
    let result = coupons;

    if (statusFilter === 'active') {
      result = result.filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date()));
    } else if (statusFilter === 'inactive') {
      result = result.filter(c => !c.isActive);
    } else if (statusFilter === 'expired') {
      result = result.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date());
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(coupon => coupon.code.toLowerCase().includes(query));
    }

    setFilteredCoupons(result);
  }, [coupons, statusFilter, searchQuery]);

  // Stats
  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length,
    totalUses: coupons.reduce((sum, c) => sum + (c.currentUses || 0), 0),
    totalRevenue: coupons.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
    totalDiscount: coupons.reduce((sum, c) => sum + (c.totalDiscount || 0), 0),
  };

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code || '',
        discountType: coupon.discountType || 'percentage',
        discountValue: coupon.discountValue != null ? coupon.discountValue.toString() : '',
        minOrderValue: coupon.minOrderValue != null ? coupon.minOrderValue.toString() : '',
        maxUses: coupon.maxUses != null ? coupon.maxUses.toString() : '',
        isSingleUse: coupon.isSingleUse || false,
        startsAt: coupon.startsAt ? coupon.startsAt.split('T')[0] : '',
        expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
        isActive: coupon.isActive !== false,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderValue: '',
        maxUses: '',
        isSingleUse: false,
        startsAt: '',
        expiresAt: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
  };

  const handleViewCoupon = async (coupon) => {
    setSelectedCoupon(coupon);
    setActiveTab('overview');
    setShowDetailModal(true);
    
    // Fetch full coupon details with usage history
    try {
      const response = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Only update if we got valid data, don't close modal on error
        if (data.coupon) {
          setSelectedCoupon(data.coupon);
        }
      }
    } catch (err) {
      console.error('Fetch coupon details error:', err);
      // Keep the modal open with initial coupon data
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discountType,
        discount_value: parseFloat(formData.discountValue) || 0,
        min_order_value: parseFloat(formData.minOrderValue) || 0,
        max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
        is_single_use: formData.isSingleUse,
        starts_at: formData.startsAt ? `${formData.startsAt}T00:00:00Z` : null,
        expires_at: formData.expiresAt ? `${formData.expiresAt}T23:59:59Z` : null,
        is_active: formData.isActive,
      };

      const url = editingCoupon 
        ? `/api/admin/coupons?id=${editingCoupon.id}`
        : '/api/admin/coupons';
      
      const response = await fetch(url, {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(couponData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save coupon');
      }

      await fetchCoupons();
      handleCloseModal();
    } catch (err) {
      console.error('Save coupon error:', err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      const response = await fetch(`/api/admin/coupons?id=${couponId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await fetchCoupons();
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountIcon = (type) => {
    switch (type) {
      case 'percentage': return Percent;
      case 'fixed': return DollarSign;
      case 'free_shipping': return Truck;
      default: return Ticket;
    }
  };

  const formatDiscount = (coupon) => {
    if (!coupon) return '';
    switch (coupon.discountType) {
      case 'percentage': return `${coupon.discountValue || 0}% off`;
      case 'fixed': return `${formatUSD(coupon.discountValue || 0)} off`;
      case 'free_shipping': return 'Free Shipping';
      default: return '';
    }
  };

  const getStatusBadge = (coupon) => {
    if (!coupon) return { label: 'Unknown', class: '' };
    if (!coupon.isActive) return { label: 'Inactive', class: styles.statusInactive };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { label: 'Expired', class: styles.statusExpired };
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) return { label: 'Exhausted', class: styles.statusExhausted };
    return { label: 'Active', class: styles.statusActive };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No limit';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateFull = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <AdminLayout title="Coupons" isLoading={isLoading}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Coupons</h1>
            <p className={styles.subtitle}>{coupons.length} total coupons</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.primaryBtn} onClick={() => handleOpenModal()}>
              <Plus size={18} strokeWidth={1.5} />
              <span>Create Coupon</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <Ticket size={20} strokeWidth={1.5} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.active}</span>
              <span className={styles.statLabel}>Active Coupons</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <Users size={20} strokeWidth={1.5} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.totalUses.toLocaleString()}</span>
              <span className={styles.statLabel}>Total Uses</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <ShoppingBag size={20} strokeWidth={1.5} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{formatUSD(stats.totalRevenue)}</span>
              <span className={styles.statLabel}>Revenue Generated</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={20} strokeWidth={1.5} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{formatUSD(stats.totalDiscount)}</span>
              <span className={styles.statLabel}>Total Discounts</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} strokeWidth={1.5} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.statusTabs}>
            {['all', 'active', 'inactive', 'expired'].map(status => (
              <button
                key={status}
                className={`${styles.statusTab} ${statusFilter === status ? styles.statusTabActive : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Coupons List */}
        <div className={styles.couponsList}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.couponCardSkeleton} />
            ))
          ) : filteredCoupons.length === 0 ? (
            <div className={styles.empty}>
              <Ticket size={48} strokeWidth={1} />
              <p>No coupons found</p>
            </div>
          ) : (
            filteredCoupons.map(coupon => {
              const DiscountIcon = getDiscountIcon(coupon.discountType);
              const status = getStatusBadge(coupon);
              
              return (
                <div key={coupon.id} className={styles.couponCard}>
                  {/* Left: Code, Status, Discount */}
                  <div className={styles.couponLeft}>
                    <div className={styles.couponCode}>
                      <span className={styles.codeText}>{coupon.code}</span>
                      <button
                        className={styles.copyBtn}
                        onClick={() => handleCopyCode(coupon.code)}
                        title="Copy code"
                      >
                        {copiedCode === coupon.code ? (
                          <Check size={14} strokeWidth={2} />
                        ) : (
                          <Copy size={14} strokeWidth={1.5} />
                        )}
                      </button>
                      <span className={`${styles.statusBadge} ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className={styles.couponDiscount}>
                      <DiscountIcon size={16} strokeWidth={1.5} />
                      <span>{formatDiscount(coupon)}</span>
                    </div>
                  </div>

                  {/* Center: Stats */}
                  <div className={styles.couponStats}>
                    <div className={styles.couponStat}>
                      <span className={styles.couponStatValue}>{coupon.currentUses || 0}</span>
                      <span className={styles.couponStatLabel}>Uses</span>
                    </div>
                    <div className={styles.couponStat}>
                      <span className={styles.couponStatValue}>{formatUSD(coupon.totalRevenue || 0)}</span>
                      <span className={styles.couponStatLabel}>Revenue</span>
                    </div>
                    <div className={styles.couponStat}>
                      <span className={styles.couponStatValue}>{formatUSD(coupon.totalDiscount || 0)}</span>
                      <span className={styles.couponStatLabel}>Discounts</span>
                    </div>
                  </div>

                  {/* Right: Meta + Actions */}
                  <div className={styles.couponRight}>
                    <div className={styles.couponMeta}>
                      {coupon.minOrderValue > 0 && (
                        <span>Min. order: {formatUSD(coupon.minOrderValue)}</span>
                      )}
                      <span>Expires: {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'No limit'}</span>
                    </div>
                    <div className={styles.couponActions}>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleViewCoupon(coupon)}
                        title="View analytics"
                      >
                        <Eye size={16} strokeWidth={1.5} />
                      </button>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => handleOpenModal(coupon)}
                        title="Edit"
                      >
                        <Edit2 size={16} strokeWidth={1.5} />
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(coupon.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <>
            <div className={styles.modalBackdrop} onClick={handleCloseModal} />
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                </h2>
                <button className={styles.modalClose} onClick={handleCloseModal}>
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Coupon Code</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="e.g., SUMMER20"
                      required
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Discount Type</label>
                      <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleInputChange}
                        className={styles.formSelect}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="free_shipping">Free Shipping</option>
                      </select>
                    </div>

                    {formData.discountType !== 'free_shipping' && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          {formData.discountType === 'percentage' ? 'Discount (%)' : 'Discount Amount'}
                        </label>
                        <input
                          type="number"
                          name="discountValue"
                          value={formData.discountValue}
                          onChange={handleInputChange}
                          className={styles.formInput}
                          min="0"
                          step={formData.discountType === 'percentage' ? '1' : '0.01'}
                          required
                        />
                    </div>
                  )}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Minimum Order Value</label>
                    <input
                      type="number"
                      name="minOrderValue"
                      value={formData.minOrderValue}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Max Uses (leave empty for unlimited)</label>
                    <input
                      type="number"
                      name="maxUses"
                      value={formData.maxUses}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      min="1"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Start Date</label>
                    <input
                      type="date"
                      name="startsAt"
                      value={formData.startsAt}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Expiry Date</label>
                    <input
                      type="date"
                      name="expiresAt"
                      value={formData.expiresAt}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="isSingleUse"
                      checked={formData.isSingleUse}
                      onChange={handleInputChange}
                    />
                    <span className={styles.checkboxMark} />
                    <span>Single use per customer</span>
                  </label>

                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <span className={styles.checkboxMark} />
                    <span>Active</span>
                  </label>
                </div>
                </div>

                <div className={styles.modalFooter}>
                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : (editingCoupon ? 'Save Changes' : 'Create Coupon')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Analytics Detail Modal */}
        {showDetailModal && selectedCoupon && (
          <>
            <div className={styles.modalBackdrop} onClick={() => setShowDetailModal(false)} />
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleGroup}>
                  <div className={styles.modalCodeBadge}>{selectedCoupon.code}</div>
                  <span className={`${styles.statusBadge} ${getStatusBadge(selectedCoupon).class}`}>
                    {getStatusBadge(selectedCoupon).label}
                  </span>
                </div>
                <button className={styles.modalClose} onClick={() => setShowDetailModal(false)}>
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              {/* Tabs */}
              <div className={styles.modalTabs}>
                <button 
                  className={`${styles.modalTab} ${activeTab === 'overview' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`${styles.modalTab} ${activeTab === 'usage' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveTab('usage')}
                >
                  Usage History ({selectedCoupon.currentUses || 0})
                </button>
              </div>

              <div className={styles.modalBody}>
                {activeTab === 'overview' && (
                  <>
                    {/* Analytics Stats */}
                    <div className={styles.analyticsGrid}>
                      <div className={styles.analyticCard}>
                        <span className={styles.analyticValue}>{selectedCoupon.currentUses || 0}</span>
                        <span className={styles.analyticLabel}>Times Used</span>
                        {selectedCoupon.maxUses > 0 && (
                          <div className={styles.progressBar}>
                            <div 
                              className={styles.progressFill}
                              style={{ width: `${Math.min(((selectedCoupon.currentUses || 0) / selectedCoupon.maxUses) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                        {selectedCoupon.maxUses > 0 && (
                          <span className={styles.analyticMeta}>of {selectedCoupon.maxUses} max</span>
                        )}
                      </div>
                      <div className={styles.analyticCard}>
                        <span className={styles.analyticValue}>{formatUSD(selectedCoupon.totalRevenue || 0)}</span>
                        <span className={styles.analyticLabel}>Revenue Generated</span>
                      </div>
                      <div className={styles.analyticCard}>
                        <span className={styles.analyticValue}>{formatUSD(selectedCoupon.totalDiscount || 0)}</span>
                        <span className={styles.analyticLabel}>Total Discounts Given</span>
                      </div>
                      <div className={styles.analyticCard}>
                        <span className={styles.analyticValue}>{formatUSD(selectedCoupon.averageOrderValue || 0)}</span>
                        <span className={styles.analyticLabel}>Avg. Order Value</span>
                      </div>
                    </div>

                    {/* Coupon Details */}
                    <div className={styles.detailSection}>
                      <h3 className={styles.detailSectionTitle}>Coupon Details</h3>
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Discount</span>
                          <span className={styles.detailValue}>{formatDiscount(selectedCoupon)}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Min. Order</span>
                          <span className={styles.detailValue}>
                            {selectedCoupon.minOrderValue > 0 ? formatUSD(selectedCoupon.minOrderValue) : 'None'}
                          </span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Single Use</span>
                          <span className={styles.detailValue}>{selectedCoupon.isSingleUse ? 'Yes' : 'No'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Valid Period</span>
                          <span className={styles.detailValue}>
                            {formatDate(selectedCoupon.startsAt)} - {formatDate(selectedCoupon.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'usage' && (
                  <div className={styles.usageList}>
                    {!selectedCoupon.usageHistory?.length ? (
                      <div className={styles.emptyState}>
                        <Users size={32} strokeWidth={1} />
                        <p>No usage history yet</p>
                      </div>
                    ) : (
                      selectedCoupon.usageHistory.map((usage, index) => (
                        <div key={index} className={styles.usageItem}>
                          <div className={styles.usageCustomer}>
                            <span className={styles.usageAvatar}>{usage.customer?.charAt(0)?.toUpperCase() || 'C'}</span>
                            <div className={styles.usageInfo}>
                              <span className={styles.usageName}>{usage.customer}</span>
                              <span className={styles.usageEmail}>{usage.email}</span>
                            </div>
                          </div>
                          <div className={styles.usageOrder}>
                            <span className={styles.usageOrderId}>{usage.orderId || 'N/A'}</span>
                            <span className={styles.usageDate}>{formatDateFull(usage.usedAt)}</span>
                          </div>
                          <div className={styles.usageAmounts}>
                            <span className={styles.usageTotal}>{formatUSD(usage.orderTotal || 0)}</span>
                            <span className={styles.usageDiscount}>-{formatUSD(usage.discount || 0)}</span>
                          </div>
                        </div>
                      ))
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

export default AdminCoupons;