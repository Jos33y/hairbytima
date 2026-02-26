// ==========================================================================
// Input Component - Enhanced with animations and better UX
// ==========================================================================

import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './../../styles/module/Input.module.css'; 

export const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  required = false,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div 
        className={`
          ${styles.inputContainer} 
          ${hasError ? styles.error : ''} 
          ${isFocused ? styles.focused : ''}
        `}
      >
        {leftIcon && (
          <span className={styles.iconLeft}>{leftIcon}</span>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            ${styles.input} 
            ${leftIcon ? styles.hasLeftIcon : ''} 
            ${rightIcon ? styles.hasRightIcon : ''}
          `}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && (
          <span className={styles.iconRight}>{rightIcon}</span>
        )}
        
        {/* Focus indicator line */}
        <motion.span 
          className={styles.focusLine}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
      
      {/* Helper/Error text with animation */}
      <AnimatePresence mode="wait">
        {(error || helperText) && (
          <motion.span 
            className={`${styles.helperText} ${hasError ? styles.errorText : ''}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {error || helperText}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

