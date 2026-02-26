// ==========================================================================
// ProductLoader - Skeleton loader for Product Details Page
// ==========================================================================

import { motion } from 'framer-motion';
import styles from '@styles/module/ProductLoader.module.css'; 

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

const ProductLoader = () => {
  return (
    <div className={styles.loader}>
      <div className={styles.container}>
        {/* Breadcrumb Skeleton */}
        <div className={styles.breadcrumb}>
          <motion.div className={styles.skeleton} style={{ width: 60 }} {...shimmer} />
          <span className={styles.sep}>/</span>
          <motion.div className={styles.skeleton} style={{ width: 50 }} {...shimmer} />
          <span className={styles.sep}>/</span>
          <motion.div className={styles.skeleton} style={{ width: 80 }} {...shimmer} />
        </div>

        <div className={styles.productGrid}>
          {/* Gallery Skeleton */}
          <div className={styles.gallery}>
            <motion.div className={styles.mainImage} {...shimmer} />
            <div className={styles.thumbnails}>
              {[1, 2, 3, 4].map((i) => (
                <motion.div key={i} className={styles.thumbnail} {...shimmer} />
              ))}
            </div>
          </div>

          {/* Info Skeleton */}
          <div className={styles.info}>
            <motion.div className={styles.skeleton} style={{ width: 100, height: 16 }} {...shimmer} />
            <motion.div className={styles.skeleton} style={{ width: '80%', height: 36, marginTop: 12 }} {...shimmer} />
            <motion.div className={styles.skeleton} style={{ width: 120, height: 28, marginTop: 16 }} {...shimmer} />
            
            <div className={styles.descLines}>
              <motion.div className={styles.skeleton} style={{ width: '100%', height: 14 }} {...shimmer} />
              <motion.div className={styles.skeleton} style={{ width: '90%', height: 14 }} {...shimmer} />
              <motion.div className={styles.skeleton} style={{ width: '70%', height: 14 }} {...shimmer} />
            </div>

            {/* Length Options */}
            <div className={styles.options}>
              <motion.div className={styles.skeleton} style={{ width: 80, height: 14 }} {...shimmer} />
              <div className={styles.lengthBtns}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div key={i} className={styles.lengthBtn} {...shimmer} />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className={styles.options}>
              <motion.div className={styles.skeleton} style={{ width: 60, height: 14 }} {...shimmer} />
              <motion.div className={styles.skeleton} style={{ width: 140, height: 48, borderRadius: 12 }} {...shimmer} />
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <motion.div className={styles.skeleton} style={{ flex: 1, height: 56, borderRadius: 12 }} {...shimmer} />
              <motion.div className={styles.skeleton} style={{ width: 56, height: 56, borderRadius: 12 }} {...shimmer} />
            </div>

            {/* Features */}
            <div className={styles.features}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.feature}>
                  <motion.div className={styles.skeleton} style={{ width: 40, height: 40, borderRadius: 8 }} {...shimmer} />
                  <div>
                    <motion.div className={styles.skeleton} style={{ width: 100, height: 14 }} {...shimmer} />
                    <motion.div className={styles.skeleton} style={{ width: 140, height: 12, marginTop: 4 }} {...shimmer} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductLoader;