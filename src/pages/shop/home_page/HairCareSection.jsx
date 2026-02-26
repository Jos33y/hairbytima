import { Link } from 'react-router-dom';
import { ArrowRight, Droplets, Scissors, Moon, Flame, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import hairCareTips from '@/data/hairCareTips.json';

const iconMap = {
  Droplets: Droplets,
  Brush: Scissors,    // Using Scissors as closest to detangling
  Moon: Moon,
  Flame: Flame,
  Sparkles: Sparkles, // Fallback
};

const HairCareSection = ({ styles }) => {
  const { tips, quickFacts } = hairCareTips;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const tipVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <section className={styles.hairCare}>
      <div className={styles.container}>
        <div className={styles.hairCareWrapper}>
          <motion.div 
            className={styles.hairCareContent}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.span 
              className={styles.hairCareLabel}
              variants={itemVariants}
            >
              Hair Care Essentials
            </motion.span>
            <motion.h2 
              className={styles.sectionTitle}
              variants={itemVariants}
            >
              Care For Your Investment
            </motion.h2>
            <motion.p 
              className={styles.sectionSubtitle}
              variants={itemVariants}
            >
              Proper maintenance extends your extensions lifespan to 12-18 months. 
              Learn the techniques that keep your hair looking salon-fresh.
            </motion.p>

            <motion.div 
              className={styles.hairCareQuickFacts}
              variants={containerVariants}
            >
              {quickFacts.map((fact, index) => (
                <motion.div 
                  key={index} 
                  className={styles.hairCareQuickFact}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.02,
                    borderColor: 'var(--accent-primary)'
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <span className={styles.hairCareQuickFactLabel}>{fact.label}</span>
                    <span className={styles.hairCareQuickFactValue}>{fact.value}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link to="/hair-care" className={styles.hairCareBtn}>
                <motion.span
                  whileHover={{ x: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  View Full Guide
                </motion.span>
                <motion.span
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight size={14} strokeWidth={1.5} />
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            className={styles.hairCareTips}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {tips.map((tip, index) => {
              const IconComponent = iconMap[tip.icon] || Sparkles;
              return (
                <motion.div 
                  key={index} 
                  className={styles.hairCareTip}
                  variants={tipVariants}
                  whileHover={{ 
                    y: -8,
                    borderColor: 'var(--accent-primary)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className={styles.hairCareTipIcon}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconComponent size={20} strokeWidth={1.5} />
                  </motion.div>
                  <h4 className={styles.hairCareTipTitle}>{tip.title}</h4>
                  <p className={styles.hairCareTipText}>{tip.shortDescription}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HairCareSection;