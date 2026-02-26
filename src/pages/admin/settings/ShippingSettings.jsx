// ==========================================================================
// Shipping Settings - Zones, Carriers, Rates
// ==========================================================================

import { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  X,
  MapPin,
  Truck,
  Package,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { SettingsLoader } from '@components/admin';
import styles from '@styles/module/AdminSettings.module.css';
import shippingStyles from '@styles/module/ShippingSettings.module.css';

const shipFromLocations = [
  { id: 'uk', name: 'United Kingdom', address: 'London, UK' },
  { id: 'us', name: 'United States', address: 'New York, USA' },
  { id: 'pt', name: 'Portugal', address: 'Lisbon, Portugal' },
  { id: 'ng', name: 'Nigeria', address: 'Lagos, Nigeria' },
  { id: 'gm', name: 'Gambia', address: 'Banjul, Gambia' },
];

const availableCountries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: '*', name: 'Rest of World (All other countries)' },
];

const defaultZoneForm = {
  name: '',
  countries: [],
  baseRate: 0,
  perItemRate: 0,
  freeShippingThreshold: '',
  estimatedDaysMin: '',
  estimatedDaysMax: '',
  isActive: true,
};

const ShippingSettings = () => {
  const { getAuthHeaders } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [zones, setZones] = useState([]);
  const [expandedZone, setExpandedZone] = useState(null);
  const [shipFrom, setShipFrom] = useState('uk');
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState(defaultZoneForm);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch zones
        const zonesResponse = await fetch('/api/admin/settings/shipping', {
          headers: getAuthHeaders(),
        });
        if (zonesResponse.ok) {
          const data = await zonesResponse.json();
          setZones(data.zones || []);
        }

        // Fetch ship from setting
        const settingsResponse = await fetch('/api/admin/settings?key=shipping', {
          headers: getAuthHeaders(),
        });
        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          if (data.setting?.value?.shipFrom) {
            setShipFrom(data.setting.value.shipFrom);
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleZoneExpand = (zoneId) => {
    setExpandedZone(expandedZone === zoneId ? null : zoneId);
  };

  const handleOpenModal = (zone = null) => {
    if (zone) {
      setEditingZone(zone);
      setZoneForm({
        name: zone.name || '',
        countries: zone.countries || [],
        baseRate: zone.baseRate || 0,
        perItemRate: zone.perItemRate || 0,
        freeShippingThreshold: zone.freeShippingThreshold || '',
        estimatedDaysMin: zone.estimatedDaysMin || '',
        estimatedDaysMax: zone.estimatedDaysMax || '',
        isActive: zone.isActive !== false,
      });
    } else {
      setEditingZone(null);
      setZoneForm(defaultZoneForm);
    }
    setShowZoneModal(true);
  };

  const handleCloseModal = () => {
    setShowZoneModal(false);
    setEditingZone(null);
    setZoneForm(defaultZoneForm);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setZoneForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCountryToggle = (countryCode) => {
    setZoneForm(prev => {
      const countries = prev.countries.includes(countryCode)
        ? prev.countries.filter(c => c !== countryCode)
        : [...prev.countries, countryCode];
      return { ...prev, countries };
    });
  };

  const handleSubmitZone = async (e) => {
    e.preventDefault();
    if (!zoneForm.name || zoneForm.countries.length === 0) {
      alert('Please enter a zone name and select at least one country');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: zoneForm.name,
        countries: zoneForm.countries,
        baseRate: parseFloat(zoneForm.baseRate) || 0,
        perItemRate: parseFloat(zoneForm.perItemRate) || 0,
        freeShippingThreshold: zoneForm.freeShippingThreshold ? parseFloat(zoneForm.freeShippingThreshold) : null,
        estimatedDaysMin: zoneForm.estimatedDaysMin ? parseInt(zoneForm.estimatedDaysMin) : null,
        estimatedDaysMax: zoneForm.estimatedDaysMax ? parseInt(zoneForm.estimatedDaysMax) : null,
        isActive: zoneForm.isActive,
      };

      let response;
      if (editingZone) {
        // Update existing zone
        response = await fetch(`/api/admin/settings/shipping?id=${editingZone.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new zone
        response = await fetch('/api/admin/settings/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (editingZone) {
          setZones(zones.map(z => z.id === editingZone.id ? data.zone : z));
        } else {
          setZones([...zones, data.zone]);
        }
        handleCloseModal();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save zone');
      }
    } catch (err) {
      console.error('Submit zone error:', err);
      alert('Failed to save zone');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleZone = async (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    
    try {
      const response = await fetch(`/api/admin/settings/shipping?id=${zoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ isActive: !zone.isActive }),
      });
      if (response.ok) {
        setZones(zones.map(z => z.id === zoneId ? { ...z, isActive: !z.isActive } : z));
      }
    } catch (err) {
      console.error('Toggle zone error:', err);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Are you sure you want to delete this shipping zone?')) return;
    
    try {
      const response = await fetch(`/api/admin/settings/shipping?id=${zoneId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setZones(zones.filter(z => z.id !== zoneId));
      }
    } catch (err) {
      console.error('Delete zone error:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ settings: { shipping: { shipFrom } } }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <SettingsLoader message="Loading shipping settings" />;
  }

  return (
    <>
      {/* Ship From Location */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Ship From Location</h2>
            <p className={styles.sectionDescription}>
              Where orders are shipped from
            </p>
          </div>
        </div>

        <div className={styles.sectionBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Primary Shipping Location</label>
            <select
              value={shipFrom}
              onChange={(e) => setShipFrom(e.target.value)}
              className={styles.formSelect}
            >
              {shipFromLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} - {loc.address}
                </option>
              ))}
            </select>
            <p className={styles.formHint}>
              This is the location from which your orders will be shipped.
            </p>
          </div>
        </div>
      </section>

      {/* Shipping Zones */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Shipping Zones</h2>
            <p className={styles.sectionDescription}>
              Configure shipping rates for different regions
            </p>
          </div>
          <button
            type="button"
            className={shippingStyles.addZoneBtn}
            onClick={() => handleOpenModal(null)}
          >
            <Plus size={18} strokeWidth={1.5} />
            <span>Add Zone</span>
          </button>
        </div>

        <div className={shippingStyles.zonesList}>
          {zones.length === 0 ? (
            <div className={shippingStyles.emptyState}>
              <MapPin size={32} strokeWidth={1} />
              <p>No shipping zones configured</p>
              <button
                type="button"
                className={shippingStyles.addZoneBtn}
                onClick={() => handleOpenModal(null)}
              >
                <Plus size={18} strokeWidth={1.5} />
                <span>Add Your First Zone</span>
              </button>
            </div>
          ) : (
            zones.map((zone) => (
              <div
                key={zone.id}
                className={`${shippingStyles.zoneCard} ${!zone.isActive ? shippingStyles.inactive : ''}`}
              >
                <div
                  className={shippingStyles.zoneHeader}
                  onClick={() => toggleZoneExpand(zone.id)}
                >
                  <div className={shippingStyles.zoneInfo}>
                    <MapPin size={18} strokeWidth={1.5} />
                    <div>
                      <h3 className={shippingStyles.zoneName}>{zone.name}</h3>
                      <p className={shippingStyles.zoneCountries}>
                        {zone.countries?.[0] === '*'
                          ? 'All other countries'
                          : `${zone.countries?.length || 0} ${zone.countries?.length === 1 ? 'country' : 'countries'}`}
                      </p>
                    </div>
                  </div>

                  <div className={shippingStyles.zoneActions}>
                    <span className={shippingStyles.carrierCount}>
                      ${zone.baseRate || 0} base rate
                    </span>
                    {expandedZone === zone.id ? (
                      <ChevronUp size={20} strokeWidth={1.5} />
                    ) : (
                      <ChevronDown size={20} strokeWidth={1.5} />
                    )}
                  </div>
                </div>

                {expandedZone === zone.id && (
                  <div className={shippingStyles.zoneBody}>
                    <div className={shippingStyles.carriersList}>
                      <div className={shippingStyles.carrierItem}>
                        <div className={shippingStyles.carrierIcon}>
                          <Package size={18} strokeWidth={1.5} />
                        </div>
                        <div className={shippingStyles.carrierInfo}>
                          <span className={shippingStyles.carrierName}>Base Rate</span>
                          <span className={shippingStyles.carrierDelivery}>
                            {zone.estimatedDaysMin && zone.estimatedDaysMax 
                              ? `${zone.estimatedDaysMin}-${zone.estimatedDaysMax} business days` 
                              : 'Delivery time varies'}
                          </span>
                        </div>
                        <span className={shippingStyles.carrierPrice}>
                          ${zone.baseRate || 0}
                        </span>
                      </div>
                      {zone.perItemRate > 0 && (
                        <div className={shippingStyles.carrierItem}>
                          <div className={shippingStyles.carrierIcon}>
                            <Package size={18} strokeWidth={1.5} />
                          </div>
                          <div className={shippingStyles.carrierInfo}>
                            <span className={shippingStyles.carrierName}>Per Item Rate</span>
                            <span className={shippingStyles.carrierDelivery}>Additional per item</span>
                          </div>
                          <span className={shippingStyles.carrierPrice}>
                            +${zone.perItemRate}
                          </span>
                        </div>
                      )}
                      {zone.freeShippingThreshold && (
                        <div className={shippingStyles.carrierItem}>
                          <div className={shippingStyles.carrierIcon}>
                            <Truck size={18} strokeWidth={1.5} />
                          </div>
                          <div className={shippingStyles.carrierInfo}>
                            <span className={shippingStyles.carrierName}>Free Shipping</span>
                            <span className={shippingStyles.carrierDelivery}>Orders over threshold</span>
                          </div>
                          <span className={shippingStyles.carrierPrice}>
                            ${zone.freeShippingThreshold}+
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={shippingStyles.zoneFooter}>
                      <button
                        type="button"
                        className={shippingStyles.zoneActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleZone(zone.id);
                        }}
                      >
                        {zone.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className={shippingStyles.zoneActionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(zone);
                        }}
                      >
                        <Edit2 size={14} strokeWidth={1.5} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className={`${shippingStyles.zoneActionBtn} ${shippingStyles.danger}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(zone.id);
                        }}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
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

      {/* Zone Modal */}
      {showZoneModal && (
        <>
          <div className={shippingStyles.modalBackdrop} onClick={handleCloseModal} />
          <div className={shippingStyles.modal}>
            <div className={shippingStyles.modalHeader}>
              <h2 className={shippingStyles.modalTitle}>
                {editingZone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
              </h2>
              <button className={shippingStyles.modalClose} onClick={handleCloseModal}>
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmitZone}>
              <div className={shippingStyles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Zone Name</label>
                  <input
                    type="text"
                    name="name"
                    value={zoneForm.name}
                    onChange={handleFormChange}
                    className={styles.formInput}
                    placeholder="e.g., United States, Europe, Rest of World"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Countries</label>
                  <div className={shippingStyles.countriesGrid}>
                    {availableCountries.map((country) => (
                      <label key={country.code} className={shippingStyles.countryCheckbox}>
                        <input
                          type="checkbox"
                          checked={zoneForm.countries.includes(country.code)}
                          onChange={() => handleCountryToggle(country.code)}
                        />
                        <span className={shippingStyles.checkmark} />
                        <span className={shippingStyles.countryLabel}>{country.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={shippingStyles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Base Rate ($)</label>
                    <input
                      type="number"
                      name="baseRate"
                      value={zoneForm.baseRate}
                      onChange={handleFormChange}
                      className={styles.formInput}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Per Item Rate ($)</label>
                    <input
                      type="number"
                      name="perItemRate"
                      value={zoneForm.perItemRate}
                      onChange={handleFormChange}
                      className={styles.formInput}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Free Shipping Threshold ($)</label>
                  <input
                    type="number"
                    name="freeShippingThreshold"
                    value={zoneForm.freeShippingThreshold}
                    onChange={handleFormChange}
                    className={styles.formInput}
                    min="0"
                    step="0.01"
                    placeholder="Leave empty for no free shipping"
                  />
                  <p className={styles.formHint}>Orders above this amount get free shipping</p>
                </div>

                <div className={shippingStyles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Est. Days (Min)</label>
                    <input
                      type="number"
                      name="estimatedDaysMin"
                      value={zoneForm.estimatedDaysMin}
                      onChange={handleFormChange}
                      className={styles.formInput}
                      min="1"
                      placeholder="e.g., 5"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Est. Days (Max)</label>
                    <input
                      type="number"
                      name="estimatedDaysMax"
                      value={zoneForm.estimatedDaysMax}
                      onChange={handleFormChange}
                      className={styles.formInput}
                      min="1"
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={shippingStyles.toggleLabel}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={zoneForm.isActive}
                      onChange={handleFormChange}
                    />
                    <span className={shippingStyles.toggleSwitch} />
                    <span>Zone is active</span>
                  </label>
                </div>
              </div>

              <div className={shippingStyles.modalFooter}>
                <button
                  type="button"
                  className={shippingStyles.cancelBtn}
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={shippingStyles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} strokeWidth={1.5} className={styles.spinner} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingZone ? 'Save Changes' : 'Add Zone'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default ShippingSettings;