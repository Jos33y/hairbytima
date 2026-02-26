// ==========================================================================
// Admin Sidebar Component
// ==========================================================================

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  Settings,
  Users,
  X,
  FolderOpen,
  BarChart3,
  MessageSquare,
  Mail
} from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminComponents.module.css';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { admin, canManageProducts, canManageCoupons, canManageAdmins } = useAuthStore();

  const navItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      path: '/admin/analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      path: '/admin/categories',
      label: 'Categories',
      icon: FolderOpen,
      permission: canManageProducts,
    },
    {
      path: '/admin/orders',
      label: 'Orders',
      icon: ShoppingCart,
    },
    {
      path: '/admin/products',
      label: 'Products',
      icon: Package,
      permission: canManageProducts,
    },
    {
      path: '/admin/customers',
      label: 'Customers',
      icon: Users,
    },
    {
      path: '/admin/coupons',
      label: 'Coupons',
      icon: Ticket,
      permission: canManageCoupons,
    },
    {
      path: '/admin/messages',
      label: 'Messages',
      icon: MessageSquare,
    },
    {
      path: '/admin/subscribers',
      label: 'Subscribers',
      icon: Mail,
    },
    {
      path: '/admin/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Mobile Close Button */}
        <button
          className={styles.sidebarClose}
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={24} strokeWidth={1.5} />
        </button>

        {/* Logo */}
        <div className={styles.sidebarLogo}>
          <img
            src="/logo512.png"
            alt="HairByTimaBlaq"
            className={styles.logoImage}
          />
          <span className={styles.logoText}>Admin</span>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            // Skip items without permission
            if (item.permission !== undefined && !item.permission()) {
              return null;
            }

            const Icon = item.icon;
            const active = isActive(item.path, item.exact);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                onClick={onClose}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Admin Info */}
        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className={styles.adminDetails}>
              <span className={styles.adminName}>{admin?.name || 'Admin'}</span>
              <span className={styles.adminRole}>{admin?.role?.replace('_', ' ') || 'Manager'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;