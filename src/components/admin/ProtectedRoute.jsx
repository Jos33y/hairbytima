// =============================================================================
// Protected Route Component
// =============================================================================
// Wraps admin routes to require authentication
// Redirects to login if not authenticated
// =============================================================================

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, ShieldX, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AuthLoader.module.css';

// Auth Loader Component
const AuthLoader = () => {
  return (
    <div className={styles.authLoader}>
      <div className={styles.loaderContent}>
        {/* Logo with animated ring */}
        <div className={styles.logoContainer}>
          <div className={styles.logoRing} />
          <div className={styles.logoRingAnimated} />
          <div className={styles.logoInner}>
            <Shield className={styles.logoIcon} strokeWidth={1.5} />
          </div>
        </div>

        {/* Progress section */}
        <div className={styles.progressSection}>
          {/* Animated bars */}
          <div className={styles.barsContainer}>
            <div className={styles.bar} style={{ '--delay': '0s' }} />
            <div className={styles.bar} style={{ '--delay': '0.1s' }} />
            <div className={styles.bar} style={{ '--delay': '0.2s' }} />
            <div className={styles.bar} style={{ '--delay': '0.3s' }} />
            <div className={styles.bar} style={{ '--delay': '0.4s' }} />
          </div>

          {/* Loading text with animated dots */}
          <div className={styles.loadingText}>
            <span>Verifying access</span>
            <span className={styles.dots}>
              <span className={styles.dot} style={{ '--delay': '0s' }}>.</span>
              <span className={styles.dot} style={{ '--delay': '0.2s' }}>.</span>
              <span className={styles.dot} style={{ '--delay': '0.4s' }}>.</span>
            </span>
          </div>

          {/* Security badge */}
          <div className={styles.securityBadge}>
            <Shield className={styles.securityIcon} strokeWidth={1.5} />
            <span className={styles.securityText}>Secure Connection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Access Denied Component
const AccessDenied = () => {
  return (
    <div className={styles.accessDenied}>
      <div className={styles.deniedContent}>
        <div className={styles.deniedIcon}>
          <ShieldX strokeWidth={1.5} />
        </div>
        <h1 className={styles.deniedTitle}>Access Denied</h1>
        <p className={styles.deniedMessage}>
          You don't have the required permissions to view this page. Please contact an administrator.
        </p>
        <a href="/admin" className={styles.deniedLink}>
          <span>Go to Dashboard</span>
          <ArrowRight size={16} strokeWidth={1.5} />
        </a>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, requiredRole = 'manager' }) => {
  const location = useLocation();
  const { isAuthenticated, checkAuth, hasRole } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    verifyAuth();
  }, [checkAuth]);

  // Show loading while checking auth
  if (isChecking) {
    return <AuthLoader />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check role permission
  if (!hasRole(requiredRole)) {
    return <AccessDenied />;
  }

  return children;
};

export default ProtectedRoute;