// ==========================================================================
// Dropdown - Select with SVG flags support
// ==========================================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { getCountryFlag } from '@components/common/CurrencyFlags';
import styles from '@styles/module/CheckoutPage.module.css';

export const Dropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  icon: Icon, 
  error, 
  touched, 
  disabled, 
  isValid 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => 
    typeof opt === 'string' ? opt === value : opt.code === value
  );

  return (
    <div className={styles.dropdownWrapper} ref={ref}>
      <button
        type="button"
        className={`${styles.dropdownBtn} ${error && touched ? styles.hasError : ''} ${disabled ? styles.disabled : ''} ${isValid && value ? styles.isValid : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {Icon && <Icon size={16} className={styles.dropdownIcon} />}
        {selectedOption ? (
          <span className={styles.dropdownValue}>
            {typeof selectedOption === 'string' ? selectedOption : (
              <>
                <span className={styles.flag}>{getCountryFlag(selectedOption.code)}</span>
                {selectedOption.name}
              </>
            )}
          </span>
        ) : (
          <span className={styles.dropdownPlaceholder}>{placeholder}</span>
        )}
        <div className={styles.dropdownRight}>
          {isValid && value && (
            <motion.div 
              className={styles.validCheck} 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
            >
              <Check size={14} />
            </motion.div>
          )}
          <ChevronDown 
            size={14} 
            className={`${styles.dropdownChevron} ${isOpen ? styles.open : ''}`} 
          />
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dropdownMenu}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className={styles.dropdownScroll}>
              {options.map((opt, idx) => {
                const optValue = typeof opt === 'string' ? opt : opt.code;
                const optLabel = typeof opt === 'string' ? opt : opt.name;
                const isSelected = optValue === value;
                
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.dropdownOption} ${isSelected ? styles.selected : ''}`}
                    onClick={() => { 
                      onChange(optValue); 
                      setIsOpen(false); 
                    }}
                  >
                    {typeof opt !== 'string' && opt.code && (
                      <span className={styles.flag}>{getCountryFlag(opt.code)}</span>
                    )}
                    <span>{optLabel}</span>
                    {isSelected && <Check size={14} className={styles.checkIcon} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && touched && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
};

