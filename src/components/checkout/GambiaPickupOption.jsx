// ==========================================================================
// GambiaPickupOption - Local store pickup for Gambia
// ==========================================================================

import { motion } from 'framer-motion';
import { Truck, Store } from 'lucide-react';
import styles from '@styles/module/CheckoutPage.module.css';

export const GambiaPickupOption = ({ selected, onSelect }) => (
  <motion.div 
    className={styles.deliveryOptions} 
    initial={{ opacity: 0, height: 0 }} 
    animate={{ opacity: 1, height: 'auto' }} 
    exit={{ opacity: 0, height: 0 }}
  >
    <label className={`${styles.deliveryOption} ${!selected ? styles.selected : ''}`}>
      <input 
        type="radio" 
        name="deliveryMethod" 
        checked={!selected} 
        onChange={() => onSelect(false)} 
      />
      <div className={styles.deliveryRadio}><div className={styles.radioDot} /></div>
      <Truck size={18} />
      <div className={styles.deliveryText}>
        <span className={styles.deliveryName}>Ship to me</span>
        <span className={styles.deliveryDesc}>Standard delivery</span>
      </div>
    </label>
    
    <label className={`${styles.deliveryOption} ${selected ? styles.selected : ''}`}>
      <input 
        type="radio" 
        name="deliveryMethod" 
        checked={selected} 
        onChange={() => onSelect(true)} 
      />
      <div className={styles.deliveryRadio}><div className={styles.radioDot} /></div>
      <Store size={18} />
      <div className={styles.deliveryText}>
        <span className={styles.deliveryName}>Pick up in store</span>
        <span className={styles.deliveryDesc}>Free • Bakau, The Gambia</span>
      </div>
      <span className={styles.freeBadge}>FREE</span>
    </label>
  </motion.div>
);

