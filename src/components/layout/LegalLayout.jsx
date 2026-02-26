// ==========================================================================
// Legal Layout - Shared wrapper for legal pages with navigation
// ==========================================================================

import { NavLink, useLocation } from 'react-router-dom'; 
import { motion } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  Package, 
  Truck,
  ChevronRight 
} from 'lucide-react';
import styles from '@styles/module/LegalPage.module.css';

const legalPages = [
  { path: '/privacy-policy', label: 'Privacy Policy', icon: Shield },
  { path: '/terms-of-service', label: 'Terms of Service', icon: FileText },
  { path: '/return-policy', label: 'Returns', icon: Package },
  { path: '/shipping-policy', label: 'Shipping', icon: Truck },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export default function LegalLayout({ 
  title, 
  lastUpdated = 'December 2024',
  children 
}) {
  const location = useLocation();

  return (
    <main className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.container}>
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h1>
          <motion.p 
            className={styles.lastUpdated}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Last updated: {lastUpdated}
          </motion.p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className={styles.navWrapper}>
        <div className={styles.container}>
          <nav className={styles.nav}>
            {legalPages.map((page) => (
              <NavLink
                key={page.path}
                to={page.path}
                className={({ isActive }) => 
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <page.icon size={16} strokeWidth={1.5} />
                <span>{page.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className={styles.container}>
        <motion.div 
          className={styles.content}
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          key={location.pathname}
        >
          {children}
        </motion.div>

        {/* Quick Links Footer */}
        <motion.div 
          className={styles.quickLinks}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className={styles.quickLinksLabel}>Quick Links:</span>
          {legalPages
            .filter(p => p.path !== location.pathname)
            .map((page) => (
              <NavLink
                key={page.path}
                to={page.path}
                className={styles.quickLink}
              >
                {page.label}
                <ChevronRight size={14} strokeWidth={2} />
              </NavLink>
            ))}
        </motion.div>
      </div>
    </main>
  );
}

// Export animation variants for use in pages
export { fadeInUp,  };