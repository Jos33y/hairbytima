import { Link } from 'react-router-dom';
import { ArrowRight, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const HeroSection = ({ styles }) => {
  // Feature pills data
  const features = [
    { label: 'Silky Bundles', delay: 0 },
    { label: 'Flawless Wigs', delay: 0.1 },
    { label: 'Closures & Frontals', delay: 0.2 },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const pillVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 40 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section className={styles.hero}>
      <div className={styles.heroBackground}>
        <motion.div 
          className={styles.heroOrb1}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div 
          className={styles.heroOrb2}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }}
        />
      </div>
      
      <div className={styles.container}>
        <div className={styles.heroWrapper}>
          <motion.div 
            className={styles.heroContent}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className={styles.heroTagline} variants={itemVariants}>
              <Crown size={14} strokeWidth={1.5} />
              <span>Premium Human Hair Extensions</span>
            </motion.div>
            
            <motion.h1 className={styles.heroTitle} variants={itemVariants}>
              Welcome,
              <span className={styles.heroTitleAccent}> Queens!</span>
            </motion.h1>
            
            <motion.p className={styles.heroSubtitle} variants={itemVariants}>
              Step into a world of premium human hair designed to elevate your beauty 
              and crown you with confidence.
            </motion.p>

            {/* Feature Pills */}
            <motion.div className={styles.heroFeatures} variants={itemVariants}>
              {features.map((feature, index) => (
                <motion.span
                  key={feature.label}
                  className={styles.heroFeaturePill}
                  variants={pillVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.6 + feature.delay }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)'
                  }}
                >
                  <Sparkles size={12} strokeWidth={1.5} />
                  {feature.label}
                </motion.span>
              ))}
            </motion.div>
            
            <motion.div className={styles.heroActions} variants={itemVariants}>
              <Link to="/shop" className={styles.heroPrimaryBtn}>
                <motion.span
                  whileHover={{ x: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  Shop Collection
                </motion.span>
                <motion.span
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight size={16} strokeWidth={1.5} />
                </motion.span>
              </Link>
              <Link to="/shop?sale=true" className={styles.heroSecondaryBtn}>
                View Offers
              </Link>
            </motion.div>
            
            <motion.div className={styles.heroPromo} variants={itemVariants}>
              <motion.span 
                className={styles.heroPromoCode}
                animate={{ 
                  boxShadow: [
                    '0 0 0 0 rgba(236, 72, 153, 0)',
                    '0 0 0 4px rgba(236, 72, 153, 0.2)',
                    '0 0 0 0 rgba(236, 72, 153, 0)',
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut'
                }}
              >
                QUEEN10
              </motion.span>
              <span className={styles.heroPromoText}>for 10% off your first order</span>
            </motion.div>
          </motion.div>

          <motion.div 
            className={styles.heroVisual}
            variants={imageVariants}
            initial="hidden"
            animate="visible"
          >
            <div className={styles.heroImageWrapper}>
              <motion.img 
                src="https://ghjfjgkmlypfkbfrtbjq.supabase.co/storage/v1/object/public/images/hero/logo512.png" 
                alt="Premium Hair Extensions"
                className={styles.heroImage}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4 }}
              />
              <motion.div 
                className={styles.heroImageGlow}
                animate={{ 
                  opacity: [0.4, 0.6, 0.4],
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;