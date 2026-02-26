// ==========================================================================
// Settings Loader - Modern game-like loading animation
// ==========================================================================

import styles from '@styles/module/SettingsLoader.module.css';

const SettingsLoader = ({ message = 'Loading settings' }) => {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loaderContent}>
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
          <span>{message}</span>
          <span className={styles.dots}>
            <span className={styles.dot} style={{ '--delay': '0s' }}>.</span>
            <span className={styles.dot} style={{ '--delay': '0.2s' }}>.</span>
            <span className={styles.dot} style={{ '--delay': '0.4s' }}>.</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SettingsLoader;