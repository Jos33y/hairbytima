// ==========================================================================
// Currency Settings - Exchange Rates Management
// ==========================================================================

import { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { SettingsLoader } from '@components/admin';
import {
  getCurrencyFlag
} from '@components/common/CurrencyFlags';
import styles from '@styles/module/AdminSettings.module.css';
import currencyStyles from '@styles/module/CurrencySettings.module.css';

// Currency data
const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D' },
];

const CurrencySettings = () => {
  const { getAuthHeaders } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Settings state
  const [defaultCustomerCurrency, setDefaultCustomerCurrency] = useState('USD');
  const [currencyPosition, setCurrencyPosition] = useState('before');

  // Exchange rates state (stored as 1 USD = X)
  const [rates, setRates] = useState({
    USD: 1,
    GBP: 0.79,
    EUR: 0.92,
    NGN: 1550,
    GMD: 70,
  });
  const [rateIds, setRateIds] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Fetch exchange rates
        const ratesRes = await fetch('/api/admin/settings/currency', {
          headers: getAuthHeaders(),
        });

        if (ratesRes.ok) {
          const data = await ratesRes.json();
          const newRates = { USD: 1 };
          const newIds = {};
          let latestUpdate = null;

          (data.rates || []).forEach(r => {
            newRates[r.toCurrency] = r.rate;
            newIds[r.toCurrency] = r.id;
            if (r.updatedAt && (!latestUpdate || new Date(r.updatedAt) > new Date(latestUpdate))) {
              latestUpdate = r.updatedAt;
            }
          });

          setRates(prev => ({ ...prev, ...newRates }));
          setRateIds(newIds);
          if (latestUpdate) setLastUpdated(latestUpdate);
        }

        // Fetch store settings (currency display preferences)
        // This API may not exist yet - handle gracefully
        try {
          const settingsRes = await fetch('/api/admin/settings/store', {
            headers: getAuthHeaders(),
          });

          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            if (settingsData.settings) {
              const s = settingsData.settings;
              if (s.defaultCustomerCurrency) setDefaultCustomerCurrency(s.defaultCustomerCurrency);
              if (s.currencyPosition) setCurrencyPosition(s.currencyPosition);
            }
          }
        } catch (settingsErr) {
          // Store settings API may not exist yet - use defaults
          console.log('Store settings API not available, using defaults');
        }
      } catch (err) {
        console.error('Fetch settings error:', err);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [getAuthHeaders]);

  const handleRateChange = (code, value) => {
    const numValue = parseFloat(value) || 0;
    setRates(prev => ({ ...prev, [code]: numValue }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // 1. Save exchange rates
      for (const [code, rate] of Object.entries(rates)) {
        if (code === 'USD') continue;

        const url = rateIds[code]
          ? `/api/admin/settings/currency?id=${rateIds[code]}`
          : '/api/admin/settings/currency';

        const res = await fetch(url, {
          method: rateIds[code] ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            fromCurrency: 'USD',
            toCurrency: code,
            rate,
            isActive: true
          }),
        });

        if (res.ok && !rateIds[code]) {
          const data = await res.json();
          if (data.rate?.id) {
            setRateIds(prev => ({ ...prev, [code]: data.rate.id }));
          }
        }
      }

      // 2. Save currency display settings (if API exists)
      try {
        const settingsRes = await fetch('/api/admin/settings/store', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            defaultCustomerCurrency,
            currencyPosition,
          }),
        });

        if (!settingsRes.ok) {
          const contentType = settingsRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            throw new Error('Failed to save display settings');
          }
          // API doesn't exist yet - just log and continue
          console.log('Store settings API not available');
        }
      } catch (settingsErr) {
        console.log('Store settings API not available, skipping display settings save');
      }

      setLastUpdated(new Date().toISOString());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const formatLastUpdated = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <SettingsLoader message="Loading currency settings" />;
  }

  return (
    <>
      {/* Error Banner */}
      {error && (
        <div className={currencyStyles.errorBanner}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Success Banner */}
      {saveSuccess && (
        <div className={currencyStyles.successBanner}>
          <Check size={16} strokeWidth={2} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Base Currency Info */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Currency Configuration</h2>
            <p className={styles.sectionDescription}>
              Product prices are stored in USD. Exchange rates convert USD to other currencies.
            </p>
          </div>
        </div>
      </section>

      {/* Exchange Rates */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Exchange Rates</h2>
            <p className={styles.sectionDescription}>
              Manual exchange rates for currency conversion
            </p>
          </div>
          <div className={currencyStyles.lastUpdated}>
            <RefreshCw size={14} strokeWidth={1.5} />
            <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
          </div>
        </div>

        <div className={currencyStyles.ratesInfo}>
          <Info size={16} strokeWidth={1.5} />
          <span>
            Rates are relative to USD. For example, if 1 USD = 0.79 GBP, enter 0.79 for GBP.
          </span>
        </div>

        <div className={currencyStyles.ratesGrid}>
          {currencies.map((currency) => {
            const isUSD = currency.code === 'USD';

            return (
              <div
                key={currency.code}
                className={`${currencyStyles.rateCard} ${isUSD ? currencyStyles.baseCard : ''}`}
              >
                <div className={currencyStyles.rateHeader}>
                  <span className={currencyStyles.rateFlag}>
                    {getCurrencyFlag(currency.code)}
                  </span>
                  <div className={currencyStyles.rateInfo}>
                    <span className={currencyStyles.rateCode}>{currency.code}</span>
                    <span className={currencyStyles.rateName}>{currency.name}</span>
                  </div>
                </div>

                <div className={currencyStyles.rateInputWrapper}>
                  <span className={currencyStyles.ratePrefix}>1 USD =</span>
                  <input
                    type="number"
                    value={rates[currency.code]}
                    onChange={(e) => handleRateChange(currency.code, e.target.value)}
                    className={currencyStyles.rateInput}
                    step="0.0001"
                    min="0"
                    disabled={currency.code === 'USD'}
                  />
                  <span className={currencyStyles.rateSuffix}>{currency.symbol}</span>
                </div>

                {currency.code === 'USD' && (
                  <span className={currencyStyles.baseLabel}>Base Currency</span>
                )}
              </div>
            );
          })}
        </div>

        <div className={currencyStyles.rateExamples}>
          <h4 className={currencyStyles.examplesTitle}>Price Examples</h4>
          <p className={currencyStyles.examplesSubtitle}>
            How a $100 USD product appears in each currency:
          </p>
          <div className={currencyStyles.examplesGrid}>
            {currencies.map((currency) => {
              const convertedPrice = 100 * rates[currency.code];

              return (
                <div key={currency.code} className={currencyStyles.exampleItem}>
                  <span className={currencyStyles.exampleFlag}>
                    {getCurrencyFlag(currency.code)}
                  </span>
                  <span className={currencyStyles.examplePrice}>
                    {currencyPosition === 'before' && currency.symbol}
                    {currency.code === 'NGN'
                      ? convertedPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : convertedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {currencyPosition === 'after' && currency.symbol}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Currency Display Settings */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Display Settings</h2>
            <p className={styles.sectionDescription}>
              How currencies are displayed to customers
            </p>
          </div>
        </div>

        <div className={styles.sectionBody}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Default Customer Currency</label>
              <div className={currencyStyles.selectWrapper}>
                <select
                  value={defaultCustomerCurrency}
                  onChange={(e) => setDefaultCustomerCurrency(e.target.value)}
                  className={styles.formSelect}
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
                <div className={currencyStyles.selectFlag}>
                  {getCurrencyFlag(defaultCustomerCurrency)}
                </div>
              </div>
              <p className={styles.formHint}>
                Currency shown to new visitors before they select one.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Currency Position</label>
              <select
                value={currencyPosition}
                onChange={(e) => setCurrencyPosition(e.target.value)}
                className={styles.formSelect}
              >
                <option value="before">Before price ($100)</option>
                <option value="after">After price (100$)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Save Button - Fixed at bottom */}
      <div className={currencyStyles.saveBar}>
        <button
          type="button"
          className={`${styles.saveBtn} ${saveSuccess ? currencyStyles.savedBtn : ''}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 size={18} strokeWidth={1.5} className={currencyStyles.spinIcon} />
              <span>Saving...</span>
            </>
          ) : saveSuccess ? (
            <>
              <Check size={18} strokeWidth={1.5} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save size={18} strokeWidth={1.5} />
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default CurrencySettings;