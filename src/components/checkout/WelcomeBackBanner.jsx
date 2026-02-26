// ==========================================================================
// WelcomeBackBanner - Returning customer greeting (no edit button)
// ==========================================================================

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import styles from '@styles/module/CheckoutPage.module.css';

export const WelcomeBackBanner = ({ customerName }) => (
  <motion.div 
    className={styles.welcomeBack}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
  >
    <div className={styles.welcomeIcon}><Heart size={18} /></div>
    <div className={styles.welcomeContent}>
      <h3 className={styles.welcomeTitle}>Welcome back, {customerName}!</h3>
      <p className={styles.welcomeText}>We've filled in your details</p>
    </div>
  </motion.div>
);

