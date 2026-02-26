import { BadgeCheck, Truck, Shield, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

const trustItems = [
  { icon: BadgeCheck, text: '100% Human Hair' },
  { icon: Shield, text: 'Quality Guarantee' },
  { icon: Truck, text: 'Worldwide Shipping' },
  { icon: Gift, text: 'Luxury Packaging' },
];

const TrustBar = ({ styles }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.section 
      className={styles.trustBar}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className={styles.container}>
        <motion.div 
          className={styles.trustGrid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {trustItems.map((item, index) => (
            <motion.div 
              key={index} 
              className={styles.trustItem}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 10 }}
                transition={{ duration: 0.2 }}
              >
                <item.icon size={18} strokeWidth={1.5} />
              </motion.div>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default TrustBar;