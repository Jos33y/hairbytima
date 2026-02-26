// ==========================================================================
// Checkout Settings - Checkout Flow Configuration
// ==========================================================================

import { useState, useEffect } from 'react';
import { ShoppingCart, CreditCard, Phone, FileText, Gift, Save } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { SettingsLoader } from '@components/admin';
import styles from '@styles/module/AdminSettings.module.css';

const CheckoutSettings = () => {
  const { getAuthHeaders } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    minimumOrderValue: 0,
    enableMinimumOrder: false,
    requirePhone: false,
    requireNotes: false,
    allowGuestCheckout: true,
    collectEmailAtCheckout: true,
    enableOrderNotes: false,
    orderNotesPlaceholder: '',
    enableGiftWrap: false,
    giftWrapPrice: 0,
    enableGiftMessage: false,
    requireTermsAcceptance: false,
    termsText: '',
    showOrderSummary: true,
    sendSmsConfirmation: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings?key=checkout', {
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
        body: JSON.stringify({ settings: { checkout: settings } }),
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
    return <SettingsLoader message="Loading checkout settings" />;
  }

  return (
    <div className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <ShoppingCart size={24} strokeWidth={1.5} />
        </div>
        <div className={styles.sectionInfo}>
          <h2 className={styles.sectionTitle}>Checkout Settings</h2>
          <p className={styles.sectionDesc}>
            Configure checkout flow, requirements, and options
          </p>
        </div>
      </div>

      <div className={styles.settingsForm}>
        {/* Order Requirements */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            <CreditCard size={18} strokeWidth={1.5} />
            Order Requirements
          </h3>
          
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Minimum Order Value</span>
              <span className={styles.toggleDesc}>
                Require a minimum order amount to checkout
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="enableMinimumOrder"
                checked={settings.enableMinimumOrder}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          {settings.enableMinimumOrder && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Minimum Amount (USD)</label>
              <input
                type="number"
                name="minimumOrderValue"
                value={settings.minimumOrderValue}
                onChange={handleChange}
                className={styles.formInput}
                min="0"
                step="1"
              />
            </div>
          )}

          <div className={styles.divider} />

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Allow Guest Checkout</span>
              <span className={styles.toggleDesc}>
                Let customers checkout without creating an account
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="allowGuestCheckout"
                checked={settings.allowGuestCheckout}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Collect Email at Checkout</span>
              <span className={styles.toggleDesc}>
                Require email for order updates (no account needed)
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="collectEmailAtCheckout"
                checked={settings.collectEmailAtCheckout}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </div>

        {/* Contact Information */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            <Phone size={18} strokeWidth={1.5} />
            Contact Information
          </h3>
          
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Require Phone Number</span>
              <span className={styles.toggleDesc}>
                Make phone number a required field at checkout
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="requirePhone"
                checked={settings.requirePhone}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Send SMS Confirmation</span>
              <span className={styles.toggleDesc}>
                Send order confirmation via SMS (requires phone)
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="sendSmsConfirmation"
                checked={settings.sendSmsConfirmation}
                onChange={handleChange}
                disabled={!settings.requirePhone}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </div>

        {/* Order Notes */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            <FileText size={18} strokeWidth={1.5} />
            Order Notes
          </h3>
          
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Enable Order Notes</span>
              <span className={styles.toggleDesc}>
                Allow customers to add special instructions
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="enableOrderNotes"
                checked={settings.enableOrderNotes}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          {settings.enableOrderNotes && (
            <>
              <div className={styles.toggleRow}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>Require Notes</span>
                  <span className={styles.toggleDesc}>
                    Make order notes a required field
                  </span>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    name="requireNotes"
                    checked={settings.requireNotes}
                    onChange={handleChange}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes Placeholder Text</label>
                <input
                  type="text"
                  name="orderNotesPlaceholder"
                  value={settings.orderNotesPlaceholder}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="Enter placeholder text..."
                />
              </div>
            </>
          )}
        </div>

        {/* Gift Options */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>
            <Gift size={18} strokeWidth={1.5} />
            Gift Options
          </h3>
          
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Enable Gift Wrap</span>
              <span className={styles.toggleDesc}>
                Offer gift wrapping as a paid option
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="enableGiftWrap"
                checked={settings.enableGiftWrap}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          {settings.enableGiftWrap && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Gift Wrap Price (USD)</label>
              <input
                type="number"
                name="giftWrapPrice"
                value={settings.giftWrapPrice}
                onChange={handleChange}
                className={styles.formInput}
                min="0"
                step="0.01"
              />
            </div>
          )}

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Enable Gift Message</span>
              <span className={styles.toggleDesc}>
                Allow customers to add a gift message
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="enableGiftMessage"
                checked={settings.enableGiftMessage}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </div>

        {/* Terms & Confirmation */}
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>Terms & Confirmation</h3>
          
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Require Terms Acceptance</span>
              <span className={styles.toggleDesc}>
                Customers must agree to terms before checkout
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="requireTermsAcceptance"
                checked={settings.requireTermsAcceptance}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider} />
            </label>
          </div>

          {settings.requireTermsAcceptance && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Terms Checkbox Text</label>
              <textarea
                name="termsText"
                value={settings.termsText}
                onChange={handleChange}
                className={styles.formTextarea}
                rows={2}
              />
            </div>
          )}

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Show Order Summary</span>
              <span className={styles.toggleDesc}>
                Display order summary in confirmation email
              </span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                name="showOrderSummary"
                checked={settings.showOrderSummary}
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

export default CheckoutSettings;