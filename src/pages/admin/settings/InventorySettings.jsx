// ==========================================================================
// Inventory Settings - Stock Thresholds & Behavior
// ==========================================================================

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { SettingsLoader } from '@components/admin';
import styles from '@styles/module/AdminSettings.module.css';

const InventorySettings = () => {
  const { getAuthHeaders } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    lowStockThreshold: 3,
    outOfStockBehavior: 'show',
    enableLowStockAlerts: false,
    enableOutOfStockAlerts: false,
    alertEmail: '',
    autoRestockReminder: false,
    restockReminderDays: 7,
    trackInventory: true,
    allowBackorders: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings?key=inventory', {
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
        body: JSON.stringify({ settings: { inventory: settings } }),
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
    return <SettingsLoader message="Loading inventory settings" />;
  }

  return (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <Package size={24} strokeWidth={1.5} />
        </div>
        <div className={styles.sectionInfo}>
          <h2 className={styles.sectionTitle}>Inventory Settings</h2>
          <p className={styles.sectionDesc}>
            Configure stock thresholds, alerts, and out-of-stock behavior
          </p>
        </div>
      </div>

      <div className={styles.settingsForm}>
        {/* Stock Tracking */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>Stock Tracking</h3>
          
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Enable Inventory Tracking</span>
              <span className={styles.toggleDesc}>
                Track stock quantities for products and variants
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="trackInventory"
                checked={settings.trackInventory}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Allow Backorders</span>
              <span className={styles.toggleDesc}>
                Allow customers to order out-of-stock items
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="allowBackorders"
                checked={settings.allowBackorders}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </div>

        {/* Stock Thresholds */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>Stock Thresholds</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Low Stock Threshold</label>
            <div className={styles.inputWithHelper}>
              <input
                type="number"
                name="lowStockThreshold"
                value={settings.lowStockThreshold}
                onChange={handleChange}
                className={styles.formInput}
                min="1"
                max="100"
              />
              <span className={styles.inputHelper}>
                Products with stock below this number will be marked as "low stock"
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Out of Stock Behavior</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="outOfStockBehavior"
                  value="show"
                  checked={settings.outOfStockBehavior === 'show'}
                  onChange={handleChange}
                />
                <span className={styles.radioMark} />
                <div className={styles.radioContent}>
                  <Eye size={16} strokeWidth={1.5} />
                  <div>
                    <span className={styles.radioLabel}>Show as Out of Stock</span>
                    <span className={styles.radioDesc}>Display product but disable purchasing</span>
                  </div>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="outOfStockBehavior"
                  value="hide"
                  checked={settings.outOfStockBehavior === 'hide'}
                  onChange={handleChange}
                />
                <span className={styles.radioMark} />
                <div className={styles.radioContent}>
                  <EyeOff size={16} strokeWidth={1.5} />
                  <div>
                    <span className={styles.radioLabel}>Hide from Store</span>
                    <span className={styles.radioDesc}>Completely hide out-of-stock products</span>
                  </div>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="outOfStockBehavior"
                  value="preorder"
                  checked={settings.outOfStockBehavior === 'preorder'}
                  onChange={handleChange}
                />
                <span className={styles.radioMark} />
                <div className={styles.radioContent}>
                  <RefreshCw size={16} strokeWidth={1.5} />
                  <div>
                    <span className={styles.radioLabel}>Allow Pre-order</span>
                    <span className={styles.radioDesc}>Let customers pre-order with expected restock date</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            <AlertTriangle size={18} strokeWidth={1.5} />
            Stock Alerts
          </h3>
          
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Low Stock Alerts</span>
              <span className={styles.toggleDesc}>
                Receive alerts when products reach low stock threshold
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="enableLowStockAlerts"
                checked={settings.enableLowStockAlerts}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Out of Stock Alerts</span>
              <span className={styles.toggleDesc}>
                Receive alerts when products go out of stock
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="enableOutOfStockAlerts"
                checked={settings.enableOutOfStockAlerts}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Alert Email</label>
            <input
              type="email"
              name="alertEmail"
              value={settings.alertEmail}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="admin@example.com"
            />
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Auto Restock Reminder</span>
              <span className={styles.toggleDesc}>
                Send reminder to restock low-stock items
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="autoRestockReminder"
                checked={settings.autoRestockReminder}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          {settings.autoRestockReminder && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Reminder Frequency (Days)</label>
              <input
                type="number"
                name="restockReminderDays"
                value={settings.restockReminderDays}
                onChange={handleChange}
                className={styles.formInput}
                min="1"
                max="30"
              />
            </div>
          )}
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

export default InventorySettings;