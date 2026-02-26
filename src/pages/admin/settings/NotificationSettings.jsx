// ==========================================================================
// Notification Settings - Email & Alert Configuration
// ==========================================================================

import { useState, useEffect } from 'react';
import { Bell, Mail, ShoppingCart, Save, } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { SettingsLoader } from '@components/admin';
import styles from '@styles/module/AdminSettings.module.css';

const NotificationSettings = () => {
  const { getAuthHeaders } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    orderConfirmation: false,
    orderShipped: false,
    orderDelivered: false,
    orderCancelled: false,
    paymentReceived: false,
    abandonedCart: false,
    abandonedCartDelay: 24,
    newOrderAlert: false,
    paymentReceivedAlert: false,
    lowStockAlert: false,
    outOfStockAlert: false,
    newCustomerAlert: false,
    refundRequestAlert: false,
    adminEmail: '',
    fromName: '',
    fromEmail: '',
    replyToEmail: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings?key=notifications', {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.setting?.value) {
            setSettings(prev => ({ ...prev, ...data.setting.value }));
          }
        }
      } catch (err) {
        console.error('Fetch settings error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ settings: { notifications: settings } }),
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <SettingsLoader message="Loading notification settings" />;
  }

  return (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <Bell size={24} strokeWidth={1.5} />
        </div>
        <div className={styles.sectionInfo}>
          <h2 className={styles.sectionTitle}>Notification Settings</h2>
          <p className={styles.sectionDesc}>
            Configure email notifications for customers and admin alerts
          </p>
        </div>
      </div>

      <div className={styles.settingsForm}>
        {/* Email Configuration */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            <Mail size={18} strokeWidth={1.5} />
            Email Configuration
          </h3>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>From Name</label>
              <input
                type="text"
                name="fromName"
                value={settings.fromName}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Your Store Name"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>From Email</label>
              <input
                type="email"
                name="fromEmail"
                value={settings.fromEmail}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="orders@example.com"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Reply-To Email</label>
              <input
                type="email"
                name="replyToEmail"
                value={settings.replyToEmail}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="support@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Admin Email</label>
              <input
                type="email"
                name="adminEmail"
                value={settings.adminEmail}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="admin@example.com"
              />
            </div>
          </div>
        </div>

        {/* Customer Emails */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            <ShoppingCart size={18} strokeWidth={1.5} />
            Customer Emails
          </h3>
          
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Order Confirmation</span>
              <span className={styles.toggleDesc}>
                Send email when order is placed
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="orderConfirmation"
                checked={settings.orderConfirmation}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Payment Received</span>
              <span className={styles.toggleDesc}>
                Send email when payment is confirmed
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="paymentReceived"
                checked={settings.paymentReceived}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Order Shipped</span>
              <span className={styles.toggleDesc}>
                Send email with tracking info when order ships
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="orderShipped"
                checked={settings.orderShipped}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Order Delivered</span>
              <span className={styles.toggleDesc}>
                Send email when order is marked as delivered
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="orderDelivered"
                checked={settings.orderDelivered}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Order Cancelled</span>
              <span className={styles.toggleDesc}>
                Send email when order is cancelled
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="orderCancelled"
                checked={settings.orderCancelled}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.divider} />

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Abandoned Cart Reminder</span>
              <span className={styles.toggleDesc}>
                Send reminder to customers who left items in cart
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="abandonedCart"
                checked={settings.abandonedCart}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          {settings.abandonedCart && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Send After (Hours)</label>
              <input
                type="number"
                name="abandonedCartDelay"
                value={settings.abandonedCartDelay}
                onChange={handleChange}
                className={styles.formInput}
                min="1"
                max="72"
              />
            </div>
          )}
        </div>

        {/* Admin Alerts */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            <Bell size={18} strokeWidth={1.5} />
            Admin Alerts
          </h3>
          
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>New Order Alert</span>
              <span className={styles.toggleDesc}>
                Get notified when a new order is placed
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="newOrderAlert"
                checked={settings.newOrderAlert}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Payment Received Alert</span>
              <span className={styles.toggleDesc}>
                Get notified when payment proof is uploaded
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="paymentReceivedAlert"
                checked={settings.paymentReceivedAlert}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Low Stock Alert</span>
              <span className={styles.toggleDesc}>
                Get notified when products reach low stock threshold
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="lowStockAlert"
                checked={settings.lowStockAlert}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Out of Stock Alert</span>
              <span className={styles.toggleDesc}>
                Get notified when products go out of stock
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="outOfStockAlert"
                checked={settings.outOfStockAlert}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>New Customer Alert</span>
              <span className={styles.toggleDesc}>
                Get notified when a new customer registers
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="newCustomerAlert"
                checked={settings.newCustomerAlert}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Refund Request Alert</span>
              <span className={styles.toggleDesc}>
                Get notified when a customer requests a refund
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="refundRequestAlert"
                checked={settings.refundRequestAlert}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className={styles.formActions}>
          <button 
            className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className={styles.spinner} />
                Saving...
              </>
            ) : saved ? (
              <>
                <Save size={18} strokeWidth={1.5} />
                Saved!
              </>
            ) : (
              <>
                <Save size={18} strokeWidth={1.5} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;