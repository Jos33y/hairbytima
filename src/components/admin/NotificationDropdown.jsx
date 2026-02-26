// ==========================================================================
// Notification Dropdown Component
// ==========================================================================

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ShoppingCart,
  Package,
  CreditCard,
  AlertTriangle,
  XCircle,
  CheckCheck,
  Volume2,
  VolumeX,
  Loader,
} from 'lucide-react';
import { useNotificationStore } from '@store/notificationStore';
import styles from '@styles/module/NotificationDropdown.module.css';

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

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    isLoading,
    getUnreadCount,
    getRecentNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    soundEnabled,
    toggleSound,
  } = useNotificationStore();

  const unreadCount = getUnreadCount();
  const recentNotifications = getRecentNotifications(5);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications({ limit: 10 });
  }, []);

  // Refetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ limit: 10 });
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead && !notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
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
    return '/admin/notifications';
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className={`${styles.bellButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Header */}
          <div className={styles.header}>
            <h3 className={styles.title}>Notifications</h3>
            <div className={styles.headerActions}>
              <button
                className={styles.soundToggle}
                onClick={toggleSound}
                title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
              >
                {soundEnabled ? (
                  <Volume2 size={16} strokeWidth={1.5} />
                ) : (
                  <VolumeX size={16} strokeWidth={1.5} />
                )}
              </button>
              {unreadCount > 0 && (
                <button
                  className={styles.markAllRead}
                  onClick={markAllAsRead}
                >
                  <CheckCheck size={14} strokeWidth={1.5} />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className={styles.list}>
            {isLoading && notifications.length === 0 ? (
              <div className={styles.empty}>
                <Loader size={24} strokeWidth={1.5} className={styles.spinner} />
                <p>Loading...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={32} strokeWidth={1} />
                <p>No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const iconColor = notificationColors[notification.type] || 'var(--text-tertiary)';
                const isRead = notification.isRead || notification.is_read;

                return (
                  <Link
                    key={notification.id}
                    to={getNotificationLink(notification)}
                    className={`${styles.item} ${!isRead ? styles.unread : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={styles.iconWrapper}
                      style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </div>
                    <div className={styles.content}>
                      <span className={styles.itemTitle}>{notification.title}</span>
                      <p className={styles.message}>{notification.message}</p>
                      <span className={styles.time}>
                        {formatTime(notification.createdAt || notification.created_at)}
                      </span>
                    </div>
                    {!isRead && <span className={styles.unreadDot} />}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <Link
              to="/admin/notifications"
              className={styles.viewAll}
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;