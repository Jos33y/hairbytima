// ==========================================================================
// Shop Page - Product Listing with Filters, Sorting, Load More
// ==========================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronRight,
  Grid3X3, 
  LayoutGrid,
  Search,
  Loader2,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard, FilterPanel, ActiveFilters, ShopLoader } from '@components/shop';
import { productService } from '@services/productService';
import { categoryService } from '@services/categoryService';
import { useCurrencyStore, CURRENCY_CONFIG } from '@store/currencyStore';
import styles from '@styles/module/ShopPage.module.css'; 

// Sort options
const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-az', label: 'Name: A to Z' },
];

const PRODUCTS_PER_LOAD = 12;
const MIN_LOADING_TIME = 2500; // 2.5 seconds minimum for luxury feel

const ShopPage = () => {
  const { category: categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { formatPrice, currency } = useCurrencyStore();
  const gridRef = useRef(null);

  // Get currency symbol from CURRENCY_CONFIG
  const currencySymbol = CURRENCY_CONFIG[currency]?.symbol || '$';

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [availableLengths, setAvailableLengths] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  
  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [gridView, setGridView] = useState('grid');

  // Helper: Extract just the number from a length string (e.g., '16"' -> '16', '16' -> '16')
  const getLengthNumber = (length) => {
    return String(length).replace(/['"″"]/g, '').trim();
  };

  // Get filter values from URL
  // Lengths are stored as just numbers in URL (e.g., "10,14,18")
  // And internally we also use just numbers for comparison
  const filters = useMemo(() => {
    const lengthsParam = searchParams.get('lengths');
    // Keep lengths as just numbers internally
    const parsedLengths = lengthsParam 
      ? lengthsParam.split(',').filter(Boolean).map(l => l.trim())
      : [];

    return {
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sort') || 'featured',
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : null,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : null,
      lengths: parsedLengths, // Just numbers: ['10', '14', '16']
      inStock: searchParams.get('inStock') === 'true',
      onSale: searchParams.get('onSale') === 'true',
      badgeTypes: searchParams.get('badges')?.split(',').filter(Boolean) || [],
    };
  }, [searchParams]);

  // Update URL with new filters
  const updateFilters = useCallback((newFilters) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...newFilters };
    
    if (merged.search) params.set('search', merged.search);
    if (merged.sortBy && merged.sortBy !== 'featured') params.set('sort', merged.sortBy);
    if (merged.minPrice !== null) params.set('minPrice', merged.minPrice.toString());
    if (merged.maxPrice !== null) params.set('maxPrice', merged.maxPrice.toString());
    // Lengths are already just numbers
    if (merged.lengths.length > 0) {
      params.set('lengths', merged.lengths.join(','));
    }
    if (merged.inStock) params.set('inStock', 'true');
    if (merged.onSale) params.set('onSale', 'true');
    if (merged.badgeTypes.length > 0) params.set('badges', merged.badgeTypes.join(','));
    
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  // Remove single filter
  const removeFilter = useCallback((filterKey, value = null) => {
    const newFilters = { ...filters };
    
    if (value !== null && Array.isArray(newFilters[filterKey])) {
      newFilters[filterKey] = newFilters[filterKey].filter(v => v !== value);
    } else {
      if (filterKey === 'minPrice' || filterKey === 'maxPrice') {
        newFilters[filterKey] = null;
      } else if (filterKey === 'inStock' || filterKey === 'onSale') {
        newFilters[filterKey] = false;
      } else if (filterKey === 'search') {
        newFilters[filterKey] = '';
      } else {
        newFilters[filterKey] = [];
      }
    }
    
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.lengths.length > 0 ||
      filters.inStock ||
      filters.onSale ||
      filters.badgeTypes.length > 0
    );
  }, [filters]);

  // Can load more?
  const hasMore = products.length < totalProducts;

  // Initial load - fetch EVERYTHING with minimum loading time
  useEffect(() => {
    const fetchAllData = async () => {
      setIsInitialLoading(true);
      const startTime = Date.now();

      try {
        // Fetch everything in parallel
        const [
          categoriesData,
          categoryData,
          lengthsData,
          pricesData,
          productsData,
        ] = await Promise.all([
          categoryService.getAll(),
          categorySlug ? categoryService.getBySlug(categorySlug) : Promise.resolve(null),
          productService.getAvailableLengths(),
          productService.getPriceRange(categorySlug),
          productService.getAll({
            categorySlug,
            search: filters.search,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            lengths: filters.lengths,
            inStock: filters.inStock || undefined,
            onSale: filters.onSale || undefined,
            badgeTypes: filters.badgeTypes,
            limit: PRODUCTS_PER_LOAD,
            page: 1,
            sortBy: filters.sortBy,
          }),
        ]);

        // Set all data
        setCategories(categoriesData);
        setCategoryInfo(categoryData);
        setAvailableLengths(lengthsData);
        setPriceRange(pricesData);
        setProducts(productsData.products);
        setTotalProducts(productsData.total);

        // Calculate remaining time to meet minimum loading duration
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

        // Wait for remaining time before showing content
        await new Promise(resolve => setTimeout(resolve, remainingTime));

      } catch (error) {
        console.error('Failed to fetch shop data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchAllData();
  }, [categorySlug]); // Only re-run on category change

  // Fetch products when filters change (but not on initial load)
  useEffect(() => {
    // Skip if still in initial loading
    if (isInitialLoading) return;

    const fetchProducts = async () => {
      setIsFiltering(true);
      
      try {
        const result = await productService.getAll({
          categorySlug,
          search: filters.search,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          lengths: filters.lengths,
          inStock: filters.inStock || undefined,
          onSale: filters.onSale || undefined,
          badgeTypes: filters.badgeTypes,
          limit: PRODUCTS_PER_LOAD,
          page: 1,
          sortBy: filters.sortBy,
        });

        setProducts(result.products);
        setTotalProducts(result.total);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setIsFiltering(false);
      }
    };

    fetchProducts();
  }, [filters, isInitialLoading]);

  // Load more products
  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    try {
      const nextPage = Math.ceil(products.length / PRODUCTS_PER_LOAD) + 1;
      
      const result = await productService.getAll({
        categorySlug,
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        lengths: filters.lengths,
        inStock: filters.inStock || undefined,
        onSale: filters.onSale || undefined,
        badgeTypes: filters.badgeTypes,
        limit: PRODUCTS_PER_LOAD,
        page: nextPage,
        sortBy: filters.sortBy,
      });

      setProducts(prev => [...prev, ...result.products]);
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Page title
  const pageTitle = useMemo(() => {
    if (filters.search) return `Search: "${filters.search}"`;
    return categoryInfo?.name || 'All Products';
  }, [filters.search, categoryInfo]);

  // Handle sort change
  const handleSortChange = (e) => {
    updateFilters({ sortBy: e.target.value });
  };

  // Handle category change
  const handleCategoryChange = (slug) => {
    const basePath = slug ? `/shop/${slug}` : '/shop';
    navigate(basePath);
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  };

  // Show loader until everything is ready
  if (isInitialLoading) {
    return <ShopLoader message="Discovering your perfect hair" />;
  }

  return (
    <motion.div 
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className={styles.container}>
        {/* Breadcrumb */}
        <motion.nav 
          className={styles.breadcrumb} 
          aria-label="Breadcrumb"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link to="/" className={styles.breadcrumbLink}>Home</Link>
          <ChevronRight size={14} strokeWidth={1.5} className={styles.separator} />
          <Link 
            to="/shop" 
            className={categorySlug || filters.search ? styles.breadcrumbLink : styles.current}
          >
            Shop
          </Link>
          {categorySlug && (
            <>
              <ChevronRight size={14} strokeWidth={1.5} className={styles.separator} />
              <span className={styles.current}>{categoryInfo?.name || categorySlug}</span>
            </>
          )}
          {filters.search && (
            <>
              <ChevronRight size={14} strokeWidth={1.5} className={styles.separator} />
              <span className={styles.current}>Search Results</span>
            </>
          )}
        </motion.nav>

        {/* Header */}
        <header className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <h1 className={styles.title}>{pageTitle}</h1>
            {categoryInfo?.description && !filters.search && (
              <motion.p 
                className={styles.description}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {categoryInfo.description}
              </motion.p>
            )}
            {filters.search && (
              <p className={styles.description}>
                {totalProducts} {totalProducts === 1 ? 'result' : 'results'} found
              </p>
            )}
          </motion.div>
        </header>

        {/* Category Pills */}
        {!filters.search && (
          <motion.div 
            className={styles.categoryPills}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button 
              onClick={() => handleCategoryChange(null)}
              className={`${styles.pill} ${!categorySlug ? styles.pillActive : ''}`}
            >
              All
            </button>
            {categories.map((cat, index) => (
              <motion.button 
                key={cat.id} 
                onClick={() => handleCategoryChange(cat.slug)}
                className={`${styles.pill} ${categorySlug === cat.slug ? styles.pillActive : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {cat.name}
                {cat.productCount > 0 && (
                  <span className={styles.pillCount}>{cat.productCount}</span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Toolbar */}
        <motion.div 
          className={styles.toolbar}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.toolbarLeft}>
            <button 
              className={`${styles.filterButton} ${showFilters ? styles.filterButtonActive : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={18} strokeWidth={1.5} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className={styles.filterBadge} />
              )}
            </button>
            <span className={styles.productCount}>
              {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
            </span>
          </div>

          <div className={styles.toolbarRight}>
            {/* View Toggle */}
            <div className={styles.viewToggle}>
              <button 
                className={`${styles.viewBtn} ${gridView === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => setGridView('grid')}
                aria-label="4 column grid view"
              >
                <Grid3X3 size={18} strokeWidth={1.5} />
              </button>
              <button 
                className={`${styles.viewBtn} ${gridView === 'large' ? styles.viewBtnActive : ''}`}
                onClick={() => setGridView('large')}
                aria-label="3 column grid view"
              >
                <LayoutGrid size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className={styles.sortWrapper}>
              <label className={styles.sortLabel}>Sort by:</label>
              <div className={styles.selectWrapper}>
                <select 
                  value={filters.sortBy} 
                  onChange={handleSortChange}
                  className={styles.sortSelect}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} strokeWidth={1.5} className={styles.selectIcon} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <FilterPanel
              filters={filters}
              updateFilters={updateFilters}
              availableLengths={availableLengths}
              priceRange={priceRange}
              formatPrice={formatPrice}
              currencySymbol={currencySymbol}
              onClose={() => setShowFilters(false)}
            />
          )}
        </AnimatePresence>

        {/* Active Filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <ActiveFilters
              filters={filters}
              removeFilter={removeFilter}
              clearAll={clearAllFilters}
              formatPrice={formatPrice}
            />
          )}
        </AnimatePresence>

        {/* Product Grid */}
        {isFiltering ? (
          <motion.div 
            className={styles.filteringOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className={styles.filteringContent}>
              <Loader2 size={32} className={styles.filteringSpinner} />
              <p className={styles.filteringText}>Updating results...</p>
            </div>
          </motion.div>
        ) : products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div 
              ref={gridRef}
              className={`${styles.grid} ${gridView === 'large' ? styles.gridLarge : ''}`}
            >
              {products.map((product, index) => (
                <motion.div 
                  key={product.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4,
                    delay: index < PRODUCTS_PER_LOAD ? index * 0.05 : 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  layout
                >
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <motion.div 
                className={styles.loadMoreSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className={styles.loadMoreCount}>
                  Showing {products.length} of {totalProducts} products
                </p>
                <button 
                  className={styles.loadMoreButton}
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Package size={18} strokeWidth={1.5} />
                      <span>Load More</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* All products loaded message */}
            {!hasMore && products.length > PRODUCTS_PER_LOAD && (
              <motion.p 
                className={styles.allLoadedMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                You've seen all {totalProducts} products
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className={styles.empty}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.emptyIcon}>
              <Search size={48} strokeWidth={1} />
            </div>
            <h3 className={styles.emptyTitle}>No products found</h3>
            <p className={styles.emptyText}>
              {hasActiveFilters 
                ? "Try adjusting your filters to find what you're looking for."
                : "Check back soon for new arrivals!"
              }
            </p>
            {hasActiveFilters && (
              <button 
                className={styles.emptyButton}
                onClick={clearAllFilters}
              >
                Clear all filters
              </button>
            )}
            <Link to="/shop" className={styles.emptyLink}>
              Browse all products
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ShopPage;