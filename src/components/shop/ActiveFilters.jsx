// ==========================================================================
// Active Filters - Removable filter chips
// ==========================================================================

import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from '@styles/module/ShopFilters.module.css'; 
 
const ActiveFilters = ({ filters, removeFilter, clearAll, formatPrice }) => {
  const chips = [];

  // Search
  if (filters.search) {
    chips.push({
      key: 'search',
      label: `"${filters.search}"`,
      onRemove: () => removeFilter('search'),
    });
  }

  // Price range
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    let label = 'Price: ';
    const formatPriceDisplay = (val) => formatPrice ? formatPrice(val) : `$${val}`;
    
    if (filters.minPrice !== null && filters.maxPrice !== null) {
      label += `${formatPriceDisplay(filters.minPrice)} - ${formatPriceDisplay(filters.maxPrice)}`;
    } else if (filters.minPrice !== null) {
      label += `${formatPriceDisplay(filters.minPrice)}+`;
    } else {
      label += `Up to ${formatPriceDisplay(filters.maxPrice)}`;
    }
    chips.push({
      key: 'price',
      label,
      onRemove: () => {
        removeFilter('minPrice');
        removeFilter('maxPrice');
      },
    });
  }

  // Lengths - display with " suffix
  filters.lengths.forEach((length) => {
    chips.push({
      key: `length-${length}`,
      label: `${length}"`,
      onRemove: () => removeFilter('lengths', length),
    });
  });

  // In Stock
  if (filters.inStock) {
    chips.push({
      key: 'inStock',
      label: 'In Stock',
      onRemove: () => removeFilter('inStock'),
    });
  }

  // On Sale
  if (filters.onSale) {
    chips.push({
      key: 'onSale',
      label: 'On Sale',
      onRemove: () => removeFilter('onSale'),
    });
  }

  // Badge types
  const badgeLabels = {
    bestseller: 'Bestseller',
    new: 'New Arrival',
    sale: 'On Sale',
    limited: 'Limited Edition',
  };

  filters.badgeTypes.forEach((badge) => {
    chips.push({
      key: `badge-${badge}`,
      label: badgeLabels[badge] || badge,
      onRemove: () => removeFilter('badgeTypes', badge),
    });
  });

  if (chips.length === 0) return null;

  return (
    <motion.div 
      className={styles.activeFilters}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.chipList}>
        {chips.map((chip, index) => (
          <motion.button
            key={chip.key}
            className={styles.chip}
            onClick={chip.onRemove}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15, delay: index * 0.03 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={styles.chipLabel}>{chip.label}</span>
            <X size={14} strokeWidth={2} className={styles.chipIcon} />
          </motion.button>
        ))}
      </div>
      
      <button 
        className={styles.clearAllChips}
        onClick={clearAll}
      >
        Clear all
      </button>
    </motion.div>
  );
};

export default ActiveFilters;