// ==========================================================================
// SavingsBanner - Subtle inline savings display
// Luxury brand appropriate - doesn't scream "discount store"
// ==========================================================================

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import styles from '@styles/module/CheckoutPage.module.css';

export const SavingsBanner = ({ savings, couponCode, formatPrice }) => {
  if (!savings || savings <= 0) return null;
  
  return (
    <motion.div 
      className={styles.savingsPill}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Sparkles size={12} />
      <span>
        Saving <strong>{formatPrice(savings)}</strong>
        {couponCode && <span className={styles.savingsPillCode}> with {couponCode}</span>}
      </span>
    </motion.div>
  );
};

