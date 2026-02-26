// ==========================================================================
// Admin Header Component
// ==========================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  LogOut, 
  ChevronDown,
  ExternalLink,
  User
} from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import NotificationDropdown from './NotificationDropdown';
import styles from '@styles/module/AdminComponents.module.css'; 

const AdminHeader = ({ onMenuClick, title }) => {
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowDropdown(false);
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const handleViewStore = () => {
    window.open('/', '_blank');
  };

  return (
    <header className={styles.header}>
      {/* Left Side */}
      <div className={styles.headerLeft}>
        <button 
          className={styles.menuButton}
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={24} strokeWidth={1.5} />
        </button>
        
        {title && <h1 className={styles.pageTitle}>{title}</h1>}
      </div>

      {/* Right Side */}
      <div className={styles.headerRight}>
        {/* View Store */}
        <button 
          className={styles.headerAction}
          onClick={handleViewStore}
          title="View Store"
        >
          <ExternalLink size={20} strokeWidth={1.5} />
          <span className={styles.actionLabel}>View Store</span>
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Admin Dropdown */}
        <div className={styles.dropdownWrapper}>
          <button 
            className={styles.adminDropdownTrigger}
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoggingOut}
          >
            <div className={styles.adminAvatarSmall}>
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <span className={styles.adminNameSmall}>{admin?.name || 'Admin'}</span>
            <ChevronDown size={16} strokeWidth={1.5} />
          </button>

          {showDropdown && (
            <>
              <div 
                className={styles.dropdownBackdrop}
                onClick={() => setShowDropdown(false)}
              />
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownAdminAvatar}>
                    {admin?.name?.charAt(0) || 'A'}
                  </div>
                  <div className={styles.dropdownAdminInfo}>
                    <span className={styles.dropdownAdminName}>{admin?.name || 'Admin'}</span>
                    <span className={styles.dropdownAdminEmail}>{admin?.email}</span>
                  </div>
                </div>
                
                <div className={styles.dropdownDivider} />
                
                <button 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/admin/settings');
                  }}
                >
                  <User size={18} strokeWidth={1.5} />
                  <span>Profile Settings</span>
                </button>
                
                <button 
                  className={styles.dropdownItem}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut size={18} strokeWidth={1.5} />
                  <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;