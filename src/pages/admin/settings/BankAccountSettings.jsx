// ==========================================================================
// Bank Account Settings - Per Currency Bank Details
// ==========================================================================

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Building2,
  Copy,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { SettingsLoader } from '@components/admin';
import styles from '@styles/module/AdminSettings.module.css';
import bankStyles from '@styles/module/BankAccountSettings.module.css';

const currencyFlags = {
  USD: '🇺🇸',
  GBP: '🇬🇧',
  EUR: '🇪🇺',
  NGN: '🇳🇬',
  GMD: '🇬🇲',
};

const currencyNames = {
  USD: 'US Dollar',
  GBP: 'British Pound',
  EUR: 'Euro',
  NGN: 'Nigerian Naira',
  GMD: 'Gambian Dalasi',
};

const BankAccountSettings = () => {
  const { getAuthHeaders } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [formData, setFormData] = useState({
    currency: 'USD',
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    sortCode: '',
    iban: '',
    swiftCode: '',
    isActive: true,
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings/bank-accounts', {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          const mapped = (data.accounts || []).map(a => ({
            ...a,
            currencyName: currencyNames[a.currency] || a.currency,
          }));
          setAccounts(mapped);
        }
      } catch (err) {
        console.error('Fetch accounts error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleOpenModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        currency: account.currency,
        bankName: account.bankName,
        accountName: account.accountName,
        accountNumber: account.accountNumber || '',
        routingNumber: account.routingNumber || '',
        sortCode: account.sortCode || '',
        iban: account.iban || '',
        swiftCode: account.swiftCode || '',
        isActive: account.isActive,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        currency: 'USD',
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        sortCode: '',
        iban: '',
        swiftCode: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAccount(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingAccount
        ? `/api/admin/settings/bank-accounts?id=${editingAccount.id}`
        : '/api/admin/settings/bank-accounts';
      
      const response = await fetch(url, {
        method: editingAccount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingAccount) {
          setAccounts(accounts.map(a => 
            a.id === editingAccount.id 
              ? { ...a, ...formData, currencyName: currencyNames[formData.currency] } 
              : a
          ));
        } else {
          setAccounts([
            ...accounts,
            {
              ...data.account,
              currencyName: currencyNames[formData.currency],
            },
          ]);
        }
        handleCloseModal();
      }
    } catch (err) {
      console.error('Save account error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) return;

    try {
      const response = await fetch(`/api/admin/settings/bank-accounts?id=${accountId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setAccounts(accounts.filter(a => a.id !== accountId));
      }
    } catch (err) {
      console.error('Delete account error:', err);
    }
  };

  const handleToggleActive = async (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    try {
      const response = await fetch(`/api/admin/settings/bank-accounts?id=${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      if (response.ok) {
        setAccounts(accounts.map(a => 
          a.id === accountId ? { ...a, isActive: !a.isActive } : a
        ));
      }
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const handleCopy = (text, fieldId) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return <SettingsLoader message="Loading bank accounts" />;
  }

  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Bank Accounts</h2>
            <p className={styles.sectionDescription}>
              Configure bank accounts for each currency
            </p>
          </div>
          <button
            type="button"
            className={bankStyles.addBtn}
            onClick={() => handleOpenModal()}
          >
            <Plus size={18} strokeWidth={1.5} />
            <span>Add Account</span>
          </button>
        </div>

        <div className={bankStyles.accountsList}>
          {accounts.length === 0 ? (
            <div className={bankStyles.empty}>
              <Building2 size={48} strokeWidth={1} />
              <p>No bank accounts configured</p>
              <button
                className={bankStyles.emptyBtn}
                onClick={() => handleOpenModal()}
              >
                Add your first bank account
              </button>
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className={`${bankStyles.accountCard} ${!account.isActive ? bankStyles.inactive : ''}`}
              >
                <div className={bankStyles.accountHeader}>
                  <div className={bankStyles.currencyBadge}>
                    <span className={bankStyles.currencyFlag}>
                      {currencyFlags[account.currency]}
                    </span>
                    <div>
                      <span className={bankStyles.currencyCode}>{account.currency}</span>
                      <span className={bankStyles.currencyName}>{account.currencyName}</span>
                    </div>
                  </div>
                  {!account.isActive && (
                    <span className={bankStyles.inactiveBadge}>Inactive</span>
                  )}
                </div>

                <div className={bankStyles.accountDetails}>
                  <div className={bankStyles.detailRow}>
                    <span className={bankStyles.detailLabel}>Bank</span>
                    <span className={bankStyles.detailValue}>{account.bankName}</span>
                  </div>
                  <div className={bankStyles.detailRow}>
                    <span className={bankStyles.detailLabel}>Account Name</span>
                    <span className={bankStyles.detailValue}>{account.accountName}</span>
                  </div>
                  {account.accountNumber && (
                    <div className={bankStyles.detailRow}>
                      <span className={bankStyles.detailLabel}>Account Number</span>
                      <div className={bankStyles.detailValueCopy}>
                        <span>{account.accountNumber}</span>
                        <button
                          type="button"
                          className={bankStyles.copyBtn}
                          onClick={() => handleCopy(account.accountNumber, `${account.id}-acc`)}
                        >
                          {copiedField === `${account.id}-acc` ? (
                            <Check size={14} strokeWidth={2} />
                          ) : (
                            <Copy size={14} strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {account.iban && (
                    <div className={bankStyles.detailRow}>
                      <span className={bankStyles.detailLabel}>IBAN</span>
                      <div className={bankStyles.detailValueCopy}>
                        <span>{account.iban}</span>
                        <button
                          type="button"
                          className={bankStyles.copyBtn}
                          onClick={() => handleCopy(account.iban, `${account.id}-iban`)}
                        >
                          {copiedField === `${account.id}-iban` ? (
                            <Check size={14} strokeWidth={2} />
                          ) : (
                            <Copy size={14} strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {account.swiftCode && (
                    <div className={bankStyles.detailRow}>
                      <span className={bankStyles.detailLabel}>SWIFT/BIC</span>
                      <span className={bankStyles.detailValue}>{account.swiftCode}</span>
                    </div>
                  )}
                </div>

                <div className={bankStyles.accountActions}>
                  <button
                    type="button"
                    className={bankStyles.actionBtn}
                    onClick={() => handleToggleActive(account.id)}
                  >
                    {account.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    className={bankStyles.actionBtn}
                    onClick={() => handleOpenModal(account)}
                  >
                    <Edit2 size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className={`${bankStyles.actionBtn} ${bankStyles.danger}`}
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <>
          <div className={bankStyles.modalBackdrop} onClick={handleCloseModal} />
          <div className={bankStyles.modal}>
            <div className={bankStyles.modalHeader}>
              <h2 className={bankStyles.modalTitle}>
                {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
              </h2>
              <button className={bankStyles.modalClose} onClick={handleCloseModal}>
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={bankStyles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className={styles.formSelect}
                  disabled={editingAccount}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="GMD">GMD - Gambian Dalasi</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="e.g., Chase Bank"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Account Holder Name</label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="e.g., HairByTimaBlaq LLC"
                  required
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className={styles.formInput}
                    placeholder="Account number"
                  />
                </div>

                {formData.currency === 'USD' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Routing Number</label>
                    <input
                      type="text"
                      name="routingNumber"
                      value={formData.routingNumber}
                      onChange={handleChange}
                      className={styles.formInput}
                      placeholder="9-digit routing number"
                    />
                  </div>
                )}

                {formData.currency === 'GBP' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Sort Code</label>
                    <input
                      type="text"
                      name="sortCode"
                      value={formData.sortCode}
                      onChange={handleChange}
                      className={styles.formInput}
                      placeholder="XX-XX-XX"
                    />
                  </div>
                )}
              </div>

              {formData.currency === 'EUR' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>IBAN</label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleChange}
                    className={styles.formInput}
                    placeholder="International Bank Account Number"
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>SWIFT/BIC Code</label>
                <input
                  type="text"
                  name="swiftCode"
                  value={formData.swiftCode}
                  onChange={handleChange}
                  className={styles.formInput}
                  placeholder="For international transfers"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={bankStyles.checkbox}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span className={bankStyles.checkboxMark} />
                  <span>Active (show to customers)</span>
                </label>
              </div>

              <div className={bankStyles.modalActions}>
                <button
                  type="button"
                  className={bankStyles.cancelBtn}
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={bankStyles.submitBtn}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : editingAccount ? 'Save Changes' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default BankAccountSettings;