// ==========================================================================
// Admin Settings Page - Main Layout with Sub-navigation
// ==========================================================================

import { NavLink, useLocation } from 'react-router-dom';
import {
  Store,
  CreditCard,
  Truck,
  Building2,
  Coins,
  Package,
  Bell,
  ShoppingCart,
} from 'lucide-react';
import { AdminLayout } from '@components/admin';
import styles from '@styles/module/AdminSettings.module.css';

// Import sub-pages for direct rendering
import GeneralSettings from './settings/GeneralSettings';
import PaymentSettings from './settings/PaymentSettings';
import ShippingSettings from './settings/ShippingSettings';
import BankAccountSettings from './settings/BankAccountSettings';
import CurrencySettings from './settings/CurrencySettings';
import InventorySettings from './settings/InventorySettings';
import NotificationSettings from './settings/NotificationSettings';
import CheckoutSettings from './settings/CheckoutSettings';

const settingsNav = [  
  {
    path: '/admin/settings',
    label: 'General',
    icon: Store,
    exact: true,
  },
  {
    path: '/admin/settings/payments',
    label: 'Payments',
    icon: CreditCard,
  },
  {
    path: '/admin/settings/currency',
    label: 'Currency',
    icon: Coins,
  },
  {
    path: '/admin/settings/shipping',
    label: 'Shipping',
    icon: Truck,
  },
  {
    path: '/admin/settings/bank-accounts',
    label: 'Bank Accounts',
    icon: Building2,
  },
  {
    path: '/admin/settings/inventory',
    label: 'Inventory',
    icon: Package,
  },
  {
    path: '/admin/settings/notifications',
    label: 'Notifications',
    icon: Bell,
  },
  {
    path: '/admin/settings/checkout',
    label: 'Checkout',
    icon: ShoppingCart,
  },
];

const AdminSettings = () => {
  const location = useLocation();

  // Determine which sub-page to show based on current path
  const renderSettingsContent = () => {
    const path = location.pathname;
    
    if (path === '/admin/settings') {
      return <GeneralSettings />;
    }
    if (path === '/admin/settings/payments') {
      return <PaymentSettings />;
    }
    if (path === '/admin/settings/currency') {
      return <CurrencySettings />;
    }
    if (path === '/admin/settings/shipping') {
      return <ShippingSettings />;
    }
    if (path === '/admin/settings/bank-accounts') {
      return <BankAccountSettings />;
    }
    if (path === '/admin/settings/inventory') {
      return <InventorySettings />;
    }
    if (path === '/admin/settings/notifications') {
      return <NotificationSettings />;
    }
    if (path === '/admin/settings/checkout') {
      return <CheckoutSettings />;
    }
    
    return <GeneralSettings />;
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <AdminLayout title="Settings" isLoading={false}>
      <div className={styles.settingsPage}>
        {/* Settings Navigation */}
        <aside className={styles.settingsNav}>
          <nav className={styles.navList}>
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                  end={item.exact}>
                  <Icon size={20} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content */}
        <main className={styles.settingsContent}>
          {renderSettingsContent()}
        </main>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;