// ==========================================================================
// Filter Panel - Expandable filter options
// ==========================================================================

import { useState, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from '@styles/module/ShopFilters.module.css';  

// Badge type options
const BADGE_OPTIONS = [
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'new', label: 'New Arrival' },
  { value: 'sale', label: 'On Sale' },
  { value: 'limited', label: 'Limited Edition' },
];

const FilterPanel = ({ 
  filters, 
  updateFilters, 
  availableLengths = [],
  priceRange = { min: 0, max: 1000 },
  formatPrice,
  currencySymbol = '$',
  onClose 
}) => {
  // Local state for price inputs (to avoid updating URL on every keystroke)
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice ?? '');
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice ?? '');
  const [priceChanged, setPriceChanged] = useState(false);
  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    length: true,
    availability: true,
    badges: false,
  });

  // Sync local state with filters
  useEffect(() => {
    setLocalMinPrice(filters.minPrice ?? '');
    setLocalMaxPrice(filters.maxPrice ?? '');
    setPriceChanged(false);
  }, [filters.minPrice, filters.maxPrice]);

  // Track price changes
  const handleMinPriceChange = (e) => {
    setLocalMinPrice(e.target.value);
    setPriceChanged(true);
  };

  const handleMaxPriceChange = (e) => {
    setLocalMaxPrice(e.target.value);
    setPriceChanged(true);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle length toggle
  const toggleLength = (length) => {
    const newLengths = filters.lengths.includes(length)
      ? filters.lengths.filter(l => l !== length)
      : [...filters.lengths, length];
    
    updateFilters({ lengths: newLengths });
  };

  // Handle badge toggle
  const toggleBadge = (badge) => {
    const newBadges = filters.badgeTypes.includes(badge)
      ? filters.badgeTypes.filter(b => b !== badge)
      : [...filters.badgeTypes, badge];
    
    updateFilters({ badgeTypes: newBadges });
  };

  // Handle availability toggle
  const toggleAvailability = (key) => {
    updateFilters({ [key]: !filters[key] });
  };

  // Apply price range
  const applyPriceRange = () => {
    const min = localMinPrice !== '' ? parseFloat(localMinPrice) : null;
    const max = localMaxPrice !== '' ? parseFloat(localMaxPrice) : null;
    updateFilters({ minPrice: min, maxPrice: max });
    setPriceChanged(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setPriceChanged(false);
    updateFilters({
      minPrice: null,
      maxPrice: null,
      lengths: [],
      inStock: false,
      onSale: false,
      badgeTypes: [],
    });
  };

  // Count active filters
  const activeFilterCount = [
    filters.minPrice !== null || filters.maxPrice !== null,
    filters.lengths.length > 0,
    filters.inStock,
    filters.onSale,
    filters.badgeTypes.length > 0,
  ].filter(Boolean).length;

  // Format display price
  const displayPrice = (value) => {
    if (formatPrice) return formatPrice(value);
    return `${currencySymbol}${value}`;
  };

  return (
    <motion.div 
      className={styles.filterPanel}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={styles.filterHeader}>
        <div className={styles.filterHeaderLeft}>
          <h3 className={styles.filterTitle}>Filters</h3>
          {activeFilterCount > 0 && (
            <span className={styles.filterCount}>{activeFilterCount} active</span>
          )}
        </div>
        <div className={styles.filterHeaderRight}>
          {activeFilterCount > 0 && (
            <button 
              className={styles.clearAllBtn}
              onClick={clearFilters}
            >
              Clear all
            </button>
          )}
          <button 
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close filters"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className={styles.filterContent}>
        {/* Price Range */}
        <div className={styles.filterSection}>
          <button 
            className={styles.sectionHeader}
            onClick={() => toggleSection('price')}
            aria-expanded={expandedSections.price}
          >
            <span className={styles.sectionTitle}>
              Price Range
              {(filters.minPrice !== null || filters.maxPrice !== null) && (
                <span className={styles.selectedCount}>(1)</span>
              )}
            </span>
            <motion.span
              animate={{ rotate: expandedSections.price ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} strokeWidth={1.5} />
            </motion.span>
          </button>
          
          {expandedSections.price && (
            <motion.div 
              className={styles.sectionContent}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.priceInputs}>
                <div className={styles.priceInputWrapper}>
                  <span className={styles.priceLabel}>Min</span>
                  <div className={styles.priceInputGroup}>
                    <span className={styles.priceCurrency}>{currencySymbol}</span>
                    <input
                      type="number"
                      value={localMinPrice}
                      onChange={handleMinPriceChange}
                      onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
                      placeholder="0"
                      className={styles.priceInput}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
                <span className={styles.priceSeparator}>–</span>
                <div className={styles.priceInputWrapper}>
                  <span className={styles.priceLabel}>Max</span>
                  <div className={styles.priceInputGroup}>
                    <span className={styles.priceCurrency}>{currencySymbol}</span>
                    <input
                      type="number"
                      value={localMaxPrice}
                      onChange={handleMaxPriceChange}
                      onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
                      placeholder="Any"
                      className={styles.priceInput}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Apply button - shows when price changed */}
              {priceChanged && (
                <motion.button
                  className={styles.applyPriceBtn}
                  onClick={applyPriceRange}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Apply
                </motion.button>
              )}
              
              <p className={styles.priceHint}>
                Products range: {displayPrice(priceRange.min)} – {displayPrice(priceRange.max)}
              </p>
            </motion.div>
          )}
        </div>

        {/* Lengths */}
        {availableLengths.length > 0 && (
          <div className={styles.filterSection}>
            <button 
              className={styles.sectionHeader}
              onClick={() => toggleSection('length')}
              aria-expanded={expandedSections.length}
            >
              <span className={styles.sectionTitle}>
                Length
                {filters.lengths.length > 0 && (
                  <span className={styles.selectedCount}>({filters.lengths.length})</span>
                )}
              </span>
              <motion.span
                animate={{ rotate: expandedSections.length ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={18} strokeWidth={1.5} />
              </motion.span>
            </button>
            
            {expandedSections.length && (
              <motion.div 
                className={styles.sectionContent}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={styles.lengthGrid}>
                  {availableLengths.map((length) => (
                    <button
                      key={length}
                      className={`${styles.lengthChip} ${
                        filters.lengths.includes(length) ? styles.lengthChipActive : ''
                      }`}
                      onClick={() => toggleLength(length)}
                    >
                      {length}"
                      {filters.lengths.includes(length) && (
                        <Check size={14} strokeWidth={2} />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Availability */}
        <div className={styles.filterSection}>
          <button 
            className={styles.sectionHeader}
            onClick={() => toggleSection('availability')}
            aria-expanded={expandedSections.availability}
          >
            <span className={styles.sectionTitle}>Availability</span>
            <motion.span
              animate={{ rotate: expandedSections.availability ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} strokeWidth={1.5} />
            </motion.span>
          </button>
          
          {expandedSections.availability && (
            <motion.div 
              className={styles.sectionContent}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.checkboxList}>
                <label className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={() => toggleAvailability('inStock')}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxCustom}>
                    {filters.inStock && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className={styles.checkboxLabel}>In Stock Only</span>
                </label>
                
                <label className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={filters.onSale}
                    onChange={() => toggleAvailability('onSale')}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxCustom}>
                    {filters.onSale && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className={styles.checkboxLabel}>On Sale</span>
                </label>
              </div>
            </motion.div>
          )}
        </div>

        {/* Badge Types */}
        <div className={styles.filterSection}>
          <button 
            className={styles.sectionHeader}
            onClick={() => toggleSection('badges')}
            aria-expanded={expandedSections.badges}
          >
            <span className={styles.sectionTitle}>
              Product Type
              {filters.badgeTypes.length > 0 && (
                <span className={styles.selectedCount}>({filters.badgeTypes.length})</span>
              )}
            </span>
            <motion.span
              animate={{ rotate: expandedSections.badges ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} strokeWidth={1.5} />
            </motion.span>
          </button>
          
          {expandedSections.badges && (
            <motion.div 
              className={styles.sectionContent}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.checkboxList}>
                {BADGE_OPTIONS.map((option) => (
                  <label key={option.value} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={filters.badgeTypes.includes(option.value)}
                      onChange={() => toggleBadge(option.value)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxCustom}>
                      {filters.badgeTypes.includes(option.value) && (
                        <Check size={12} strokeWidth={3} />
                      )}
                    </span>
                    <span className={styles.checkboxLabel}>{option.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FilterPanel;