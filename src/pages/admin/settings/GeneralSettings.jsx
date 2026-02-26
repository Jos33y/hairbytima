// ==========================================================================
// General Settings - Store Info, Contact, Socials
// ==========================================================================

import { useState, useEffect, useRef } from 'react';
import { Store, Instagram, Facebook, Twitter, Youtube, Save, Loader2, Check, Upload, Trash2 } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { SettingsLoader } from '@components/admin';
import styles from '@styles/module/AdminSettings.module.css';

const GeneralSettings = () => {
  const { getAuthHeaders } = useAuthStore(); 
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    storeName: '',
    storeTagline: '',
    contactEmail: '',
    contactPhone: '',
    supportEmail: '',
    address: '',
    instagram: '',
    facebook: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    logo: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch general settings
        const settingsResponse = await fetch('/api/admin/settings?key=general', {
          headers: getAuthHeaders(),
        });
        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          if (data.setting?.value) {
            setSettings(prev => ({ ...prev, ...data.setting.value }));
          }
        }

        // Fetch logo from store_logo setting
        const logoResponse = await fetch('/api/admin/settings?key=store_logo', {
          headers: getAuthHeaders(),
        });
        if (logoResponse.ok) {
          const logoData = await logoResponse.json();
          if (logoData.setting?.value?.url) {
            setSettings(prev => ({ ...prev, logo: logoData.setting.value.url }));
          }
        }
      } catch (err) {
        console.error('Fetch settings error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, WebP, GIF, or SVG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to API
      const response = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          file: base64,
          fileName: file.name,
          assetType: 'logo',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, logo: data.url }));
        setSaved(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to upload logo');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload logo');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) return;

    try {
      const response = await fetch('/api/admin/settings/upload?assetType=logo', {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, logo: null }));
        setSaved(false);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save settings without logo (logo is saved separately in storage)
      const { logo, ...settingsWithoutLogo } = settings;
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ settings: { general: settingsWithoutLogo } }),
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
    return <SettingsLoader message="Loading general settings" />;
  }

  return (
    <>
      {/* Store Information */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Store Information</h2>
            <p className={styles.sectionDescription}>
              Basic information about your store
            </p>
          </div>
        </div>

        <div className={styles.sectionBody}>
          {/* Logo Upload */}
          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label className={styles.formLabel}>Store Logo</label>
            <div className={styles.logoUpload}>
              <div className={styles.logoPreview}>
                {isUploading ? (
                  <Loader2 size={32} strokeWidth={1.5} className={styles.spinner} />
                ) : settings.logo ? (
                  <img src={settings.logo} alt="Store logo" />
                ) : (
                  <Store size={32} strokeWidth={1} className={styles.logoPlaceholder} />
                )}
              </div>
              <div className={styles.logoActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                <button 
                  type="button" 
                  className={styles.uploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload size={16} strokeWidth={1.5} />
                  <span>{isUploading ? 'Uploading...' : 'Upload Logo'}</span>
                </button>
                {settings.logo && (
                  <button 
                    type="button" 
                    className={styles.removeLogoBtn}
                    onClick={handleRemoveLogo}
                    disabled={isUploading}
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                    <span>Remove</span>
                  </button>
                )}
                <p className={styles.formHint}>
                  Recommended: 512x512px, PNG or SVG. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Store Name</label>
              <input
                type="text"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Your store name"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tagline</label>
              <input
                type="text"
                name="storeTagline"
                value={settings.storeTagline}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Short tagline"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label className={styles.formLabel}>Business Address</label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="Full business address"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Contact Information</h2>
            <p className={styles.sectionDescription}>
              How customers can reach you
            </p>
          </div>
        </div>

        <div className={styles.sectionBody}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={settings.contactEmail}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="hello@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Support Email</label>
              <input
                type="email"
                name="supportEmail"
                value={settings.supportEmail}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="support@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone Number</label>
              <input
                type="tel"
                name="contactPhone"
                value={settings.contactPhone}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="+44 123 456 7890"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Social Media</h2>
            <p className={styles.sectionDescription}>
              Connect your social media accounts
            </p>
          </div>
        </div>

        <div className={styles.sectionBody}>
          <div className={styles.socialLinks}>
            <div className={styles.socialLink}>
              <div className={styles.socialIcon}>
                <Instagram size={20} strokeWidth={1.5} />
              </div>
              <input
                type="url"
                name="instagram"
                value={settings.instagram}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="https://instagram.com/yourstore"
              />
            </div>

            <div className={styles.socialLink}>
              <div className={styles.socialIcon}>
                <Facebook size={20} strokeWidth={1.5} />
              </div>
              <input
                type="url"
                name="facebook"
                value={settings.facebook}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="https://facebook.com/yourstore"
              />
            </div>

            <div className={styles.socialLink}>
              <div className={styles.socialIcon}>
                <Twitter size={20} strokeWidth={1.5} />
              </div>
              <input
                type="url"
                name="twitter"
                value={settings.twitter}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="https://twitter.com/yourstore"
              />
            </div>

            <div className={styles.socialLink}>
              <div className={styles.socialIcon}>
                <Youtube size={20} strokeWidth={1.5} />
              </div>
              <input
                type="url"
                name="youtube"
                value={settings.youtube}
                onChange={handleChange}
                className={styles.formInput}
                placeholder="https://youtube.com/@yourstore"
              />
            </div>
          </div>
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

export default GeneralSettings;