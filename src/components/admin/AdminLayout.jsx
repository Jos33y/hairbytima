// ==========================================================================
// Admin Layout Component - with Content Loader Overlay
// ==========================================================================

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '@styles/admin-tokens.css';
import styles from '@styles/module/AdminComponents.module.css';
import loaderStyles from '@styles/module/AdminLoader.module.css';

// Content Loader Overlay Component
const ContentLoader = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      // Reset and show
      setFadeOut(false);
      setVisible(true);
      setProgress(0);

      // Animate progress while loading
      let currentProgress = 0;
      intervalRef.current = setInterval(() => {
        // Slow down as we approach 90%
        const increment = currentProgress < 30 ? 8 :
          currentProgress < 60 ? 5 :
            currentProgress < 80 ? 2 : 0.5;

        currentProgress = Math.min(currentProgress + increment, 92);
        setProgress(Math.round(currentProgress));
      }, 150);

    } else if (visible) {
      // Loading finished - complete the progress
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Quick completion animation
      setProgress(100);

      // Fade out after completion
      setTimeout(() => {
        setFadeOut(true);
      }, 300);

      // Hide completely
      setTimeout(() => {
        setVisible(false);
        setFadeOut(false);
        setProgress(0);
      }, 600);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className="admin">
      <div className={`${loaderStyles.loaderOverlay} ${fadeOut ? loaderStyles.fadeOut : ''}`}>
        <div className={loaderStyles.loaderContent}>
          {/* Circular spinner */}
          <div className={loaderStyles.loaderSpinner}>
            <div className={loaderStyles.spinnerRing} />
            <span className={loaderStyles.spinnerPercent}>{progress}%</span>
          </div>

          {/* Progress bar */}
          <div className={loaderStyles.loaderBarContainer}>
            <div className={loaderStyles.loaderBar}>
              <div
                className={loaderStyles.loaderFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <span className={loaderStyles.loaderText}>Loading content...</span>
        </div>
      </div>
    </div>
  );
};

const AdminLayout = ({ title, children, isLoading = false }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin">
      <div className={styles.adminLayout}>
        {/* Sidebar */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Header */}
          <AdminHeader
            onMenuClick={() => setSidebarOpen(true)}
            title={title}
          />

          {/* Page Content with Loader Overlay */}
          <main className={styles.pageContent}>
            {/* Loader overlays the content */}
            <ContentLoader isLoading={isLoading} />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;