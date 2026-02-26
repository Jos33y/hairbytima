// ==========================================================================
// NotFoundPage - 404 Error Page
// ==========================================================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, ShoppingBag } from 'lucide-react';
import styles from '@styles/module/NotFoundPage.module.css';

const NotFoundPage = () => {
  return (
    <motion.main 
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background Elements */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      
      <div className={styles.container}>
        {/* 404 Number */}
        <motion.div 
          className={styles.errorCode}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className={styles.four}>4</span>
          <div className={styles.zero}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 20h20M4 20V10l4 4 4-8 4 8 4-4v10" />
              <circle cx="12" cy="4" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className={styles.four}>4</span>
        </motion.div>

        {/* Message */}
        <motion.div 
          className={styles.message}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className={styles.title}>Page Not Found</h1>
          <p className={styles.subtitle}>
            Oops! The page you're looking for seems to have slipped away like silk through fingers.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div 
          className={styles.actions}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/" className={styles.primaryBtn}>
            <Home size={18} />
            Back to Home
          </Link>
          <Link to="/shop" className={styles.secondaryBtn}>
            <ShoppingBag size={18} />
            Browse Shop
          </Link>
        </motion.div>

        {/* Quick Links */}
        <motion.div 
          className={styles.quickLinks}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className={styles.quickLinksTitle}>Popular Destinations</p>
          <div className={styles.links}>
            <Link to="/shop/bundles">Hair Bundles</Link>
            <Link to="/shop/wigs">Wigs</Link>
            <Link to="/shop/closures">Closures</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.button 
          className={styles.backBtn}
          onClick={() => window.history.back()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <ArrowLeft size={16} />
          Go Back
        </motion.button>
      </div>
    </motion.main>
  );
};

export default NotFoundPage;