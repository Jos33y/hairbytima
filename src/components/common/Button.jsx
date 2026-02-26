import { forwardRef } from 'react';
import styles from './../../styles/module/Button.module.css';

export const Button = forwardRef(({ 
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  as: Component = 'button',
  to,
  href,
  ...props
}, ref) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ].filter(Boolean).join(' ');

  // Determine the element to render
  const isLink = Component !== 'button' || to || href;
  
  // Build props for the element
  const elementProps = {
    ref,
    className: classes,
    disabled: disabled || loading,
    ...props,
  };

  // Add link-specific props
  if (to) {
    elementProps.to = to;
  }
  if (href) {
    elementProps.href = href;
  }

  return (
    <Component {...elementProps}>
      {loading && (
        <span className={styles.spinner} aria-hidden="true" />
      )}
      {!loading && leftIcon && (
        <span className={styles.icon}>{leftIcon}</span>
      )}
      <span className={styles.text}>{children}</span>
      {!loading && rightIcon && (
        <span className={styles.icon}>{rightIcon}</span>
      )}
    </Component>
  );
});

Button.displayName = 'Button';

