// ==========================================================================
// Payment Settings - Klarna, Bank Transfer Toggles
// ==========================================================================

import { useState, useEffect } from 'react';
import { Save, Loader2, Building2, AlertCircle, Check } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { SettingsLoader } from '@components/admin';
import styles from '@styles/module/AdminSettings.module.css';

const PaymentSettings = () => {
  const { getAuthHeaders } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    klarnaEnabled: false,
    klarnaTestMode: false,
    bankTransferEnabled: false,
    bankTransferInstructions: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings?key=payments', {
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

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ settings: { payments: settings } }),
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
    return <SettingsLoader message="Loading payment settings" />;
  }

  return (
    <>
      {/* Klarna */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Klarna</h2>
            <p className={styles.sectionDescription}>
              Accept payments with Klarna - Buy now, pay later
            </p>
          </div>
        </div>

        <div className={styles.sectionBody}>
          <div className={styles.toggleGroup}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Enable Klarna</span>
              <span className={styles.toggleDescription}>
                Allow customers to pay with Klarna at checkout
              </span>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${settings.klarnaEnabled ? styles.active : ''}`}
              onClick={() => handleToggle('klarnaEnabled')}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          {settings.klarnaEnabled && (
            <>
              <div style={{ height: 'var(--space-4)' }} />
              
              <div className={styles.toggleGroup}>
                <div className={styles.toggleInfo}>
                  <span className={styles.toggleLabel}>Test Mode</span>
                  <span className={styles.toggleDescription}>
                    Use Klarna sandbox for testing (no real payments)
                  </span>
                </div>
                <button
                  type="button"
                  className={`${styles.toggle} ${settings.klarnaTestMode ? styles.active : ''}`}
                  onClick={() => handleToggle('klarnaTestMode')}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>

              {settings.klarnaTestMode && (
                <div style={{ 
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  fontSize: 'var(--text-sm)',
                  color: '#f59e0b'
                }}>
                  <AlertCircle size={18} strokeWidth={1.5} />
                  <span>Test mode is enabled. No real payments will be processed.</span>
                </div>
              )}

              <div style={{ height: 'var(--space-4)' }} />

              <p className={styles.formHint}>
                Klarna API credentials are configured in environment variables (KLARNA_API_KEY, KLARNA_API_SECRET).
              </p>
            </>
          )}
        </div>
      </section>

      {/* Bank Transfer */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Bank Transfer</h2>
            <p className={styles.sectionDescription}>
              Accept direct bank transfers as payment
            </p>
          </div>
        </div>

        <div className={styles.sectionBody}>
          <div className={styles.toggleGroup}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Enable Bank Transfer</span>
              <span className={styles.toggleDescription}>
                Allow customers to pay via direct bank transfer
              </span>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${settings.bankTransferEnabled ? styles.active : ''}`}
              onClick={() => handleToggle('bankTransferEnabled')}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          {settings.bankTransferEnabled && (
            <>
              <div style={{ height: 'var(--space-4)' }} />

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Payment Instructions</label>
                <textarea
                  name="bankTransferInstructions"
                  value={settings.bankTransferInstructions}
                  onChange={handleChange}
                  className={styles.formTextarea}
                  placeholder="Instructions shown to customers after selecting bank transfer..."
                  rows={4}
                />
                <p className={styles.formHint}>
                  This message will be shown to customers who select bank transfer at checkout.
                </p>
              </div>

              <div style={{ 
                marginTop: 'var(--space-4)',
                padding: 'var(--space-4)',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)'
              }}>
                <Building2 size={20} strokeWidth={1.5} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Bank account details are managed in the <strong>Bank Accounts</strong> section.
                  </p>
                  <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Configure separate bank accounts for each currency (USD, GBP, EUR, NGN, GMD).
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.saveActions}>
          <button
            type="button"
            className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} strokeWidth={1.5} className={styles.spinner} />
                <span>Saving...</span>
              </>
            ) : saved ? (
              <>
                <Check size={18} strokeWidth={1.5} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={18} strokeWidth={1.5} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </section>
    </>
  );
};

export default PaymentSettings;