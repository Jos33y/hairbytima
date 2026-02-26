import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Menu, X, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchModal } from '@/components/common';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore'; 
import { 
  useCurrencyStore, 
  getCurrencySymbol,
  getCurrencyName,
} from '@/store/currencyStore';
import { getCurrencyFlag } from '@/components/common/CurrencyFlags';  
import styles from '@/styles/module/Header.module.css';

const navLinks = [
  { path: '/shop', label: 'Shop All' },
  { path: '/hair-care', label: 'Hair Care' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
];

export const Header = () => { 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  const itemCount = useCartStore((state) => state.getItemCount());
  const wishlistCount = useWishlistStore((state) => state.getItemCount());
  
  // Currency store
  const currency = useCurrencyStore((state) => state.currency);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);
  const availableCurrencies = useCurrencyStore((state) => state.availableCurrencies);
  const initialize = useCurrencyStore((state) => state.initialize);
  const isLoading = useCurrencyStore((state) => state.isLoading);

  // Initialize currency store (fetch rates from backend)
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleCurrencySelect = (curr) => {
    setCurrency(curr);
    setIsCurrencyOpen(false);
  };

  // Animation variants
  const badgeVariants = {
    initial: { scale: 0 },
    animate: { scale: 1 },
    tap: { scale: 0.8 },
  };

  const mobileMenuVariants = {
    closed: { x: '-100%', opacity: 0 },
    open: { x: 0, opacity: 1 },
  };

  const mobileNavItemVariants = {
    closed: { x: -20, opacity: 0 },
    open: (i) => ({
      x: 0,
      opacity: 1,
      transition: { delay: i * 0.1 },
    }),
  };

  return (
    <>
      {/* Top Bar - Desktop Only */}
      <div className={styles.topbar}>
        <div className={styles.topbarContainer}>
          <motion.p 
            className={styles.topbarText}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Life is short, make every hair flip satisfying
          </motion.p>
          <motion.div 
            className={styles.topbarRight}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/orders" className={styles.topbarLink}>
              My Orders
            </Link>
            <span className={styles.topbarDivider}>|</span>
            <Link to="/track-order" className={styles.topbarLink}>
              Track Order
            </Link>
            <span className={styles.topbarDivider}>|</span>
            <Link to="/faq" className={styles.topbarLink}>
              Help
            </Link>
            <div className={styles.currencyWrapper}>
              <motion.button 
                className={styles.currencyTrigger}
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                aria-expanded={isCurrencyOpen}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                <span className={styles.currencyFlag}>{getCurrencyFlag(currency)}</span>
                <span className={styles.currencyCode}>{currency}</span>
                <motion.span
                  animate={{ rotate: isCurrencyOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} strokeWidth={1.5} />
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {isCurrencyOpen && (
                  <>
                    <div 
                      className={styles.currencyBackdrop}
                      onClick={() => setIsCurrencyOpen(false)}
                    />
                    <motion.div 
                      className={styles.currencyDropdown}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      {availableCurrencies.map((curr, index) => (
                        <motion.button
                          key={curr}
                          className={`${styles.currencyOption} ${currency === curr ? styles.active : ''}`}
                          onClick={() => handleCurrencySelect(curr)}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ x: 4, backgroundColor: 'var(--bg-elevated)' }}
                        >
                          <span className={styles.currencyFlag}>{getCurrencyFlag(curr)}</span>
                          <span className={styles.currencyDetails}>
                            <span className={styles.currencyCode}>{curr}</span>
                            <span className={styles.currencyName}>{getCurrencyName(curr)}</span>
                          </span>
                          {currency === curr && (
                            <motion.span 
                              className={styles.currencyCheck}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              ✓
                            </motion.span>
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.container}>
          {/* Mobile Menu Button */}
          <motion.button 
            className={styles.menuButton}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} strokeWidth={1.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={24} strokeWidth={1.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Logo */}
          <Link to="/" className={styles.logo} onClick={closeMobileMenu}>
            <motion.img 
              src="/logo192.png" 
              alt="HairByTimaBlaq" 
              className={styles.logoImage}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
            <span className={styles.logoText}>HairByTimaBlaq</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.nav}>
            {navLinks.map((link, index) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => 
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
              >
                <motion.span
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {link.label}
                </motion.span>
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className={styles.actions}>
            <motion.button 
              className={styles.iconButton} 
              aria-label="Search"
              onClick={() => setIsSearchOpen(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Search size={20} strokeWidth={1.5} />
            </motion.button>
            
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link to="/wishlist" className={styles.iconButton} aria-label="Wishlist">
                <Heart size={20} strokeWidth={1.5} />
                <AnimatePresence>
                  {wishlistCount > 0 && (
                    <motion.span 
                      className={styles.wishlistBadge}
                      variants={badgeVariants}
                      initial="initial"
                      animate="animate"
                      exit="initial"
                      key={wishlistCount}
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link to="/cart" className={styles.cartButton} aria-label="Cart">
                <ShoppingBag size={20} strokeWidth={1.5} />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span 
                      className={styles.cartBadge}
                      variants={badgeVariants}
                      initial="initial"
                      animate="animate"
                      exit="initial"
                      key={itemCount}
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className={styles.mobileNav}
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <nav className={styles.mobileNavLinks}>
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    custom={index}
                    variants={mobileNavItemVariants}
                    initial="closed"
                    animate="open"
                  >
                    <NavLink
                      to={link.path}
                      className={({ isActive }) => 
                        `${styles.mobileNavLink} ${isActive ? styles.active : ''}`
                      }
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
                
                <div className={styles.mobileNavDivider} />
                
                {[
                  { path: '/orders', label: 'My Orders' },
                  { path: '/track-order', label: 'Track Order' },
                  { path: '/faq', label: 'Help' },
                ].map((link, index) => (
                  <motion.div
                    key={link.path}
                    custom={navLinks.length + index + 1}
                    variants={mobileNavItemVariants}
                    initial="closed"
                    animate="open"
                  >
                    <NavLink
                      to={link.path}
                      className={styles.mobileNavLink}
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
                
                {/* Mobile Currency Selector */}
                <motion.div 
                  className={styles.mobileCurrency}
                  custom={navLinks.length + 4}
                  variants={mobileNavItemVariants}
                  initial="closed"
                  animate="open"
                >
                  <span className={styles.mobileCurrencyLabel}>Select Currency</span>
                  <div className={styles.mobileCurrencyOptions}>
                    {availableCurrencies.map((curr) => (
                      <motion.button
                        key={curr}
                        className={`${styles.mobileCurrencyBtn} ${currency === curr ? styles.active : ''}`}
                        onClick={() => setCurrency(curr)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className={styles.currencyFlag}>{getCurrencyFlag(curr)}</span>
                        <span>{curr}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
};

