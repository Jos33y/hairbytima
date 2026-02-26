import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productService, categoryService } from '@/services';
import { useCurrencyStore } from '@/store/currencyStore';
import { trackSearch } from '@/utils/analytics';
import styles from '@/styles/module/SearchModal.module.css'; 

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { formatPrice } = useCurrencyStore();

  const debouncedQuery = useDebounce(query, 300);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await categoryService.getAll();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hbt-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Search products with debouncing
  useEffect(() => {
    const searchProducts = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const searchResults = await productService.search(debouncedQuery.trim());
        setResults(searchResults.slice(0, 6));
        
        // Track search with results count
        trackSearch(debouncedQuery.trim(), searchResults.length);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [debouncedQuery]);

  // Save to recent searches
  const saveRecentSearch = useCallback((searchTerm) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('hbt-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Handle product click
  const handleProductClick = (product) => {
    saveRecentSearch(product.name);
    onClose();
  };

  // Handle search submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      // Track search submission (navigating to search results page)
      trackSearch(query.trim(), results.length);
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  // Handle recent search click
  const handleRecentClick = (term) => {
    setQuery(term);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('hbt-recent-searches');
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: { duration: 0.2 }
    },
  };

  const resultVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05 },
    }),
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.overlay} 
        onClick={onClose}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div 
          className={styles.modal} 
          onClick={(e) => e.stopPropagation()}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className={styles.header}>
            <form onSubmit={handleSubmit} className={styles.searchForm}>
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Loader2 size={20} strokeWidth={1.5} className={styles.searchIcon} />
                </motion.div>
              ) : (
                <Search size={20} strokeWidth={1.5} className={styles.searchIcon} />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className={styles.input}
                autoComplete="off"
              />
              <AnimatePresence>
                {query && (
                  <motion.button 
                    type="button"
                    className={styles.clearBtn}
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={18} strokeWidth={1.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>
            <motion.button 
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close search"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={24} strokeWidth={1.5} />
            </motion.button>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {/* Search Results */}
            <AnimatePresence mode="wait">
              {results.length > 0 && (
                <motion.div 
                  className={styles.section}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className={styles.sectionTitle}>Products</h3>
                  <div className={styles.results}>
                    {results.map((product, index) => (
                      <motion.div
                        key={product.id}
                        custom={index}
                        variants={resultVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Link
                          to={`/product/${product.slug}`}
                          className={styles.resultItem}
                          onClick={() => handleProductClick(product)}
                        >
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className={styles.resultImage}
                          />
                          <div className={styles.resultInfo}>
                            <span className={styles.resultCategory}>
                              {product.category?.name || 'Hair'}
                            </span>
                            <span className={styles.resultName}>{product.name}</span>
                            <span className={styles.resultPrice}>
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <ArrowRight size={16} strokeWidth={1.5} className={styles.resultArrow} />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  {query.trim().length >= 2 && (
                    <motion.button 
                      className={styles.viewAllBtn}
                      onClick={handleSubmit}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      View all results for "{query}"
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading State */}
            {loading && query.trim().length >= 2 && results.length === 0 && (
              <div className={styles.loadingState}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Loader2 size={24} strokeWidth={1.5} />
                </motion.div>
                <span>Searching...</span>
              </div>
            )}

            {/* No Results */}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <motion.div 
                className={styles.noResults}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className={styles.noResultsText}>No products found for "{query}"</p>
                <p className={styles.noResultsHint}>Try a different search term</p>
              </motion.div>
            )}

            {/* Recent Searches */}
            {query.trim().length < 2 && recentSearches.length > 0 && (
              <motion.div 
                className={styles.section}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Recent Searches</h3>
                  <motion.button 
                    className={styles.clearAllBtn}
                    onClick={clearRecentSearches}
                    whileHover={{ color: 'var(--accent-primary)' }}
                  >
                    Clear all
                  </motion.button>
                </div>
                <div className={styles.recentList}>
                  {recentSearches.map((term, index) => (
                    <motion.button
                      key={index}
                      className={styles.recentItem}
                      onClick={() => handleRecentClick(term)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, borderColor: 'var(--accent-primary)' }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Search size={14} strokeWidth={1.5} />
                      {term}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Popular Categories - Dynamic from Backend */}
            {query.trim().length < 2 && (
              <motion.div 
                className={styles.section}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className={styles.sectionTitle}>Shop by Category</h3>
                <div className={styles.categories}>
                  {categoriesLoading ? (
                    // Loading skeleton
                    [...Array(4)].map((_, index) => (
                      <div key={index} className={styles.categoryLinkSkeleton} />
                    ))
                  ) : categories.length > 0 ? (
                    categories.map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link 
                          to={`/shop/${category.slug}`}
                          className={styles.categoryLink}
                          onClick={onClose}
                        >
                          {category.name}
                          {category.product_count > 0 && (
                            <span className={styles.categoryCount}>
                              {category.product_count}
                            </span>
                          )}
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    // Fallback if no categories
                    <p className={styles.noCategories}>No categories available</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

