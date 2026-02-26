// ==========================================================================
// Admin Notifications Page - Full History
// ==========================================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ShoppingCart,
  Package,
  CreditCard,
  AlertTriangle,
  XCircle,
  Check,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Search,
  RefreshCw,
  Loader,
} from 'lucide-react';
import { AdminLayout } from '@components/admin';
import { useNotificationStore } from '@store/notificationStore';
import styles from '@styles/module/AdminNotifications.module.css';

const notificationIcons = {
  new_order: ShoppingCart,
  payment_received: CreditCard,
  payment_proof_uploaded: CreditCard,
  low_stock: Package,
  out_of_stock: AlertTriangle,
  new_customer: Bell,
  order_cancelled: XCircle,
  refund_requested: AlertTriangle,
};

const notificationColors = {
  new_order: 'var(--accent-primary)',
  payment_received: '#10b981',
  payment_proof_uploaded: '#3b82f6',
  low_stock: '#f59e0b',
  out_of_stock: '#ef4444',
  new_customer: '#8b5cf6',
  order_cancelled: '#ef4444',
  refund_requested: '#f59e0b',
}; 

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'new_order', label: 'Orders' },
  { value: 'payment_received', label: 'Payments' },
  { value: 'payment_proof_uploaded', label: 'Proof Uploads' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'order_cancelled', label: 'Cancellations' },
];

const AdminNotifications = () => {
  const {
    notifications,
    isLoading,
    getUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    soundEnabled,
    toggleSound,
  } = useNotificationStore();

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const unreadCount = getUnreadCount();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications({ limit: 50 });
  }, []);

  // Filter notifications
  const filteredNotifications = notifications
    .filter((n) => {
      if (filter === 'unread') return !n.is_read && !n.isRead;
      if (filter !== 'all') return n.type === filter;
      return true;
    })
    .filter((n) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkMarkRead = async () => {
    for (const id of selectedIds) {
      await markAsRead(id);
    }
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.length} notifications?`)) {
      for (const id of selectedIds) {
        await deleteNotification(id);
      }
      setSelectedIds([]);
    }
  };

  const handleRefresh = () => {
    fetchNotifications({ limit: 50 });
  };

  const getNotificationLink = (notification) => {
    // Use link from database if available
    if (notification.link) {
      return notification.link;
    }
    // Fallback to constructing from metadata
    if (notification.orderId || notification.metadata?.order_id) {
      return `/admin/orders/${notification.orderId || notification.metadata?.order_id}`;
    }
    if (notification.productId || notification.metadata?.product_id) {
      return `/admin/products/${notification.productId || notification.metadata?.product_id}`;
    }
    return null;
  };

  return (
    <AdminLayout title="Notifications" isLoading={isLoading}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>Notifications</h1>
            <p className={styles.subtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.soundToggle}
              onClick={toggleSound}
              title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
            >
              {soundEnabled ? (
                <Volume2 size={18} strokeWidth={1.5} />
              ) : (
                <VolumeX size={18} strokeWidth={1.5} />
              )}
              <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
            </button>
            <button
              className={styles.refreshBtn}
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh notifications"
            >
              <RefreshCw size={18} strokeWidth={1.5} className={isLoading ? styles.spinning : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} strokeWidth={1.5} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterTabs}>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                className={`${styles.filterTab} ${filter === option.value ? styles.active : ''}`}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
                {option.value === 'unread' && unreadCount > 0 && (
                  <span className={styles.filterBadge}>{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkCount}>
              {selectedIds.length} selected
            </span>
            <button className={styles.bulkBtn} onClick={handleBulkMarkRead}>
              <Check size={16} strokeWidth={1.5} />
              <span>Mark as Read</span>
            </button>
            <button
              className={`${styles.bulkBtn} ${styles.danger}`}
              onClick={handleBulkDelete}
            >
              <Trash2 size={16} strokeWidth={1.5} />
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Quick Actions */}
        {unreadCount > 0 && selectedIds.length === 0 && (
          <div className={styles.quickActions}>
            <button className={styles.markAllBtn} onClick={markAllAsRead}>
              <CheckCheck size={18} strokeWidth={1.5} />
              <span>Mark all as read</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className={styles.list}>
          {isLoading && notifications.length === 0 ? (
            <div className={styles.empty}>
              <Loader size={48} strokeWidth={1} className={styles.spinning} />
              <h3>Loading notifications...</h3>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className={styles.empty}>
              <Bell size={48} strokeWidth={1} />
              <h3>No notifications</h3>
              <p>
                {filter !== 'all' || searchQuery
                  ? 'Try adjusting your filters'
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className={styles.selectAllRow}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span className={styles.checkboxMark} />
                  <span>Select all</span>
                </label>
              </div>

              {filteredNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const iconColor =
                  notificationColors[notification.type] || 'var(--text-tertiary)';
                const link = getNotificationLink(notification);
                const isRead = notification.is_read || notification.isRead;

                return (
                  <div
                    key={notification.id}
                    className={`${styles.item} ${!isRead ? styles.unread : ''} ${selectedIds.includes(notification.id) ? styles.selected : ''}`}
                  >
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => handleSelect(notification.id)}
                      />
                      <span className={styles.checkboxMark} />
                    </label>

                    <div
                      className={styles.iconWrapper}
                      style={{
                        backgroundColor: `${iconColor}15`,
                        color: iconColor,
                      }}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                    </div>

                    <div className={styles.content}>
                      <div className={styles.contentHeader}>
                        <span className={styles.itemTitle}>
                          {notification.title}
                        </span>
                        <span className={styles.time}>
                          {formatDate(notification.created_at || notification.createdAt)}
                        </span>
                      </div>
                      <p className={styles.message}>{notification.message}</p>
                      {link && (
                        <Link to={link} className={styles.itemLink}>
                          View details
                        </Link>
                      )}
                    </div>

                    <div className={styles.itemActions}>
                      {!isRead && (
                        <button
                          className={styles.itemAction}
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check size={16} strokeWidth={1.5} />
                        </button>
                      )}
                      <button
                        className={`${styles.itemAction} ${styles.danger}`}
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>

                    {!isRead && <span className={styles.unreadDot} />}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Clear All */}
        {notifications.length > 0 && (
          <div className={styles.footer}>
            <button
              className={styles.clearAllBtn}
              onClick={() => {
                if (window.confirm('Clear all notifications? This cannot be undone.')) {
                  clearAllNotifications();
                }
              }}
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;