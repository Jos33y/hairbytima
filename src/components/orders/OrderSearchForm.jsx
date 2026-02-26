// ==========================================================================
// OrderSearchForm - Collapsible Search Form for Order Tracking
// ==========================================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mail,
  Hash,
  AlertCircle,
  Loader2,
  ChevronDown,
  X,
} from 'lucide-react';
import styles from '@styles/module/orders/OrderSearchForm.module.css';

const OrderSearchForm = ({
  email,
  setEmail,
  orderNumber,
  setOrderNumber,
  onSearch,
  isSearching,
  error,
  hasResults = false,
  onClear,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-collapse when results first come in
  useEffect(() => {
    if (hasResults) {
      setIsExpanded(false);
    }
  }, [hasResults]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleClear = () => {
    setEmail('');
    setOrderNumber('');
    setIsExpanded(true);
    onClear?.();
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  return (
    <div className={styles.wrapper}>
      <AnimatePresence mode="wait">
        {hasResults && !isExpanded ? (
          // Collapsed State - Show current order info
          <motion.div
            key="collapsed"
            className={styles.collapsedBar}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className={styles.collapsedInfo}>
              <span className={styles.collapsedLabel}>Tracking</span>
              <span className={styles.collapsedOrder}>{orderNumber}</span>
            </div>
            <div className={styles.collapsedActions}>
              <button
                type="button"
                className={styles.expandBtn}
                onClick={handleExpand}
              >
                <Search size={14} />
                Track Another
              </button>
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClear}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          // Expanded State - Full Form
          <motion.form
            key="expanded"
            className={styles.form}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className={styles.searchCard}>
              {hasResults && (
                <button
                  type="button"
                  className={styles.collapseBtn}
                  onClick={handleCollapse}
                >
                  <ChevronDown size={18} />
                  Hide
                </button>
              )}

              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    <Mail size={14} />
                    Email Address
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className={styles.input}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    <Hash size={14} />
                    Order Number
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. HBT-2025-ABC123"
                      className={styles.input}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    className={styles.errorMessage}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className={styles.searchBtn}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Track Order
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderSearchForm;