// ==========================================================================
// InputField - Form input with validation
// ==========================================================================

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import styles from '@styles/module/CheckoutPage.module.css';

export const InputField = ({ 
  icon: Icon, 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  onBlur,
  placeholder, 
  error, 
  touched, 
  required, 
  autoComplete, 
  disabled, 
  autoFilled, 
  isValid 
}) => (
  <div className={styles.inputGroup}>
    {label && (
      <label className={styles.inputLabel}>
        {label}{required && <span className={styles.required}>*</span>}
      </label>
    )}
    <div className={`${styles.inputWrapper} ${error && touched ? styles.hasError : ''} ${disabled ? styles.disabled : ''} ${autoFilled ? styles.autoFilled : ''} ${isValid ? styles.isValid : ''}`}>
      {Icon && <Icon size={16} className={styles.inputIcon} />}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={styles.input}
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
    {error && touched && (
      <motion.span 
        className={styles.fieldError} 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        {error}
      </motion.span>
    )}
  </div>
);

