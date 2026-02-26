// ==========================================================================
// Wishlist Loader - Loading state for wishlist page
// ==========================================================================

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import styles from '@styles/module/WishlistLoader.module.css';  

const WishlistLoader = () => {
  return (
    <div className={styles.loader}>
      <div className={styles.content}>
        {/* Animated heart */}
        <motion.div 
          className={styles.iconWrapper}
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Heart size={48} strokeWidth={1.5} className={styles.icon} />
          <motion.div 
            className={styles.pulse}
            animate={{ 
              scale: [1, 2],
              opacity: [0.5, 0]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        </motion.div>
        
        {/* Loading text */}
        <motion.p 
          className={styles.text}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading your wishlist...
        </motion.p>

        {/* Skeleton cards */}
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div 
              key={i}
              className={styles.skeletonCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={styles.skeletonImage} />
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonPrice} />
                <div className={styles.skeletonButton} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistLoader;