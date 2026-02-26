// ==========================================================================
// PhoneInput - Phone with country code selector
// ==========================================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { getCountryFlag } from '@components/common/CurrencyFlags';
import { COUNTRIES, getCountryByCode } from '@constants/locationConstants';
import styles from '@styles/module/CheckoutPage.module.css';

export const PhoneInput = ({ 
  value, 
  onChange, 
  countryCode, 
  onCountryChange, 
  error, 
  touched, 
  autoFilled, 
  isValid 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selectedCountry = getCountryByCode(countryCode) || COUNTRIES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.phoneInputWrapper}>
      <div className={`${styles.phoneInput} ${error && touched ? styles.hasError : ''} ${autoFilled ? styles.autoFilled : ''} ${isValid && value ? styles.isValid : ''}`}>
        <div className={styles.phoneCountry} ref={ref}>
          <button 
            type="button" 
            className={styles.phoneCountryBtn} 
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={styles.flag}>{getCountryFlag(selectedCountry.code)}</span>
            <span className={styles.dialCode}>{selectedCountry.dialCode}</span>
            <ChevronDown 
              size={10} 
              className={`${styles.phoneChevron} ${isOpen ? styles.open : ''}`} 
            />
          </button>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                className={styles.phoneDropdown} 
                initial={{ opacity: 0, y: -8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }}
              >
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className={`${styles.phoneOption} ${country.code === countryCode ? styles.selected : ''}`}
                    onClick={() => { 
                      onCountryChange(country.code); 
                      setIsOpen(false); 
                    }}
                  >
                    <span className={styles.flag}>{getCountryFlag(country.code)}</span>
                    <span className={styles.countryName}>{country.name}</span>
                    <span className={styles.dialCode}>{country.dialCode}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="Phone number"
          className={styles.phoneField}
        />
        
        {isValid && value && (
          <motion.div 
            className={styles.validCheck} 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
          >
            <Check size={14} />
          </motion.div>
        )}
      </div>
      {error && touched && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
};

