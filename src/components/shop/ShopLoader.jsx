// ==========================================================================
// Shop Loader - Luxury loading animation for shop pages
// ==========================================================================

import { motion } from 'framer-motion';
import styles from '@styles/module/ShopPage.module.css';  

const ShopLoader = ({ message = 'Loading' }) => {
  return (
    <motion.div 
      className={styles.loaderPage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.loaderContainer}>
        {/* Animated Diamond Icon */}
        <motion.div 
          className={styles.loaderIcon}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 64 64" 
            fill="none"
            className={styles.loaderSvg}
          >
            {/* Outer diamond */}
            <motion.path
              d="M32 4L60 32L32 60L4 32L32 4Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
            />
            {/* Middle diamond */}
            <motion.path
              d="M32 14L50 32L32 50L14 32L32 14Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: 0.2
              }}
            />
            {/* Inner diamond */}
            <motion.path
              d="M32 24L40 32L32 40L24 32L32 24Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                delay: 0.4
              }}
            />
          </svg>
        </motion.div>

        {/* Animated text */}
        <motion.div 
          className={styles.loaderTextWrapper}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className={styles.loaderMessage}>{message}</p>
          
          {/* Animated dots */}
          <div className={styles.loaderDots}>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className={styles.loaderDot}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Skeleton Preview */}
        <motion.div 
          className={styles.loaderSkeleton}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={styles.skeletonCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <div className={styles.skeletonImage} />
              <div className={styles.skeletonText} />
              <div className={styles.skeletonPrice} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ShopLoader;