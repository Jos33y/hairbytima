// ==========================================================================
// Stats Card Component
// ==========================================================================

import styles from '@styles/module/AdminComponents.module.css';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  prefix = '',
  suffix = '',
  loading = false 
}) => {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';

  if (loading) {
    return (
      <div className={styles.statsCard}>
        <div className={styles.statsCardSkeleton}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonValue} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.statsCard}>
      <div className={styles.statsCardHeader}>
        <span className={styles.statsCardTitle}>{title}</span>
        {Icon && (
          <div className={styles.statsCardIcon}>
            <Icon size={20} strokeWidth={1.5} />
          </div>
        )}
      </div>
      
      <div className={styles.statsCardBody}>
        <span className={styles.statsCardValue}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
        
        {trend && trendValue && (
          <span className={`${styles.statsCardTrend} ${isPositive ? styles.trendUp : ''} ${isNegative ? styles.trendDown : ''}`}>
            {isPositive && '+'}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;