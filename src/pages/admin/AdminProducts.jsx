// ==========================================================================
// Admin Products Page - Real API Integration
// ==========================================================================

import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus,
  Edit2,
  Trash2,
  Package,
  X,
  Check,
  AlertTriangle,
  Archive,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Heart,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { AdminLayout, ImageUpload } from '@components/admin'; 
import { useAuthStore } from '@store/authStore';
import styles from '@styles/module/AdminProducts.module.css';  

// Format as USD for admin display (all values stored in USD)
const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const AdminProducts = () => {
  const { getAuthHeaders } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Products state
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [expandedInventory, setExpandedInventory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  
  // View toggle
  const [activeView, setActiveView] = useState('products');
  
  // Wishlist data
  const [wishlistData, setWishlistData] = useState([]);
  const [wishlistStats, setWishlistStats] = useState({
    totalSaves: 0,
    totalUniqueVisitors: 0,
    productsWishlisted: 0,
  });
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category_id: '',
    price: '',
    cost_price: '',
    compare_at_price: '',
    description: '',
    images: [],
    weight: '',
    weight_unit: 'g',
    low_stock_threshold: '3',
    variants: [],
    in_stock: true,
    featured: false,
    is_archived: false,
    badge_type: '',
    badge_text: '',
  });

  const lengthOptions = ['10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'];
  const LOW_STOCK_THRESHOLD = 3;

  // Fetch products and categories
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Handle URL parameters after products are loaded
  useEffect(() => {
    if (!isLoading && !urlParamsProcessed) {
      processUrlParams();
      setUrlParamsProcessed(true);
    }
  }, [isLoading, products, urlParamsProcessed]);

  // Check for /new route
  useEffect(() => {
    if (location.pathname.endsWith('/new') && !isLoading) {
      handleOpenModal();
      // Clear the /new from URL
      navigate('/admin/products', { replace: true });
    }
  }, [location.pathname, isLoading]);

  const processUrlParams = () => {
    // Handle stock filter from URL
    const stockParam = searchParams.get('stock');
    if (stockParam) {
      switch (stockParam) {
        case 'low':
          setStockFilter('low-stock');
          setStatusFilter('active');
          break;
        case 'out':
          setStockFilter('out-of-stock');
          setStatusFilter('active');
          break;
        case 'in':
          setStockFilter('in-stock');
          setStatusFilter('active');
          break;
        default:
          break;
      }
    }

    // Handle highlight (open product modal)
    const highlightId = searchParams.get('highlight');
    if (highlightId && products.length > 0) {
      const productToEdit = products.find(p => p.id === highlightId);
      if (productToEdit) {
        handleOpenModal(productToEdit);
      }
      // Clear highlight param after processing
      searchParams.delete('highlight');
      setSearchParams(searchParams, { replace: true });
    }

    // Handle action=new param as alternative to /new route
    const actionParam = searchParams.get('action');
    if (actionParam === 'new') {
      handleOpenModal();
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all products including archived
      const response = await fetch('/api/admin/products?archived=all&limit=100', {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
      setFilteredProducts(data.products || []);
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories', {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  // Fetch wishlist data
  useEffect(() => {
    if (activeView === 'wishlists' && wishlistData.length === 0) {
      fetchWishlistData();
    }
  }, [activeView]);

  const fetchWishlistData = async () => {
    setWishlistLoading(true);
    try {
      const response = await fetch('/api/admin/products/wishlists', {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setWishlistData(data.products || []);
        // Use pre-calculated stats from API (correct unique visitor count)
        if (data.stats) {
          setWishlistStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Fetch wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Filter products
  useEffect(() => {
    let result = products;

    // Filter by status (archived/active)
    if (statusFilter === 'active') {
      result = result.filter(p => !p.is_archived);
    } else if (statusFilter === 'archived') {
      result = result.filter(p => p.is_archived);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.category_id === categoryFilter);
    }

    // Filter by stock status
    if (stockFilter === 'in-stock') {
      result = result.filter(product => getTotalStock(product) > 0);
    } else if (stockFilter === 'low-stock') {
      result = result.filter(product => {
        const total = getTotalStock(product);
        const threshold = product.low_stock_threshold || LOW_STOCK_THRESHOLD;
        return total > 0 && total <= threshold;
      });
    } else if (stockFilter === 'out-of-stock') {
      result = result.filter(product => getTotalStock(product) === 0);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query) ||
        product.variants?.some(v => v.sku?.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(result);
  }, [products, categoryFilter, stockFilter, statusFilter, searchQuery]);

  // Calculate total stock for a product
  // Calculate total stock for a product
  const getTotalStock = (product) => {
    // If product has variants, sum their quantities
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);
    }
    // If no variants, use in_stock boolean (1 = in stock, 0 = out of stock)
    return product.in_stock ? 1 : 0;
  };

  // Get stock status
  const getStockStatus = (product) => {
    const total = getTotalStock(product);
    const threshold = product.low_stock_threshold || LOW_STOCK_THRESHOLD;
    
    if (total === 0) return { status: 'out', label: 'Out of Stock', class: 'stockOut' };
    if (total <= threshold) return { status: 'low', label: 'Low Stock', class: 'stockLow' };
    return { status: 'in', label: 'In Stock', class: 'stockIn' };
  };

  // Calculate profit margin
  const getProfitMargin = (price, costPrice) => {
    if (!price || !costPrice) return 0;
    return (((price - costPrice) / price) * 100).toFixed(1);
  };

  const handleOpenModal = (product = null) => {
    setFormError(null);
    if (product) {
      setEditingProduct(product);
      
      // Build images array from product data
      const images = [];
      if (product.image) {
        images.push({ url: product.image, path: null });
      }
      if (product.hover_image) {
        images.push({ url: product.hover_image, path: null });
      }
      if (product.gallery && product.gallery.length > 0) {
        product.gallery.forEach(url => {
          if (!images.find(img => img.url === url)) {
            images.push({ url, path: null });
          }
        });
      }

      setFormData({
        name: product.name,
        slug: product.slug,
        category_id: product.category_id || '',
        price: product.price?.toString() || '',
        cost_price: product.cost_price?.toString() || '',
        compare_at_price: product.compare_at_price?.toString() || '',
        description: product.description || '',
        images: images,
        weight: product.weight?.toString() || '',
        weight_unit: product.weight_unit || 'g',
        low_stock_threshold: product.low_stock_threshold?.toString() || '3',
        variants: product.variants || [],
        in_stock: product.in_stock !== false,
        featured: product.featured || false,
        is_archived: product.is_archived || false,
        badge_type: product.badge_type || '',
        badge_text: product.badge_text || '',
      });
      setExpandedInventory(true);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        slug: '',
        category_id: categories[0]?.id || '',
        price: '',
        cost_price: '',
        compare_at_price: '',
        description: '',
        images: [],
        weight: '',
        weight_unit: 'g',
        low_stock_threshold: '3',
        variants: [],
        in_stock: true,
        featured: false,
        is_archived: false,
        badge_type: '',
        badge_text: '',
      });
      setExpandedInventory(false);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLengthToggle = (length) => {
    setFormData(prev => {
      const hasLength = prev.variants.some(v => v.length === length);
      
      if (hasLength) {
        return {
          ...prev,
          variants: prev.variants.filter(v => v.length !== length),
        };
      } else {
        const slug = prev.slug || 'product';
        const newVariant = {
          length,
          sku: `${slug.toUpperCase().replace(/-/g, '')}-${length.replace('"', '')}`,
          quantity: 0,
          price_adjustment: 0,
        };
        const newVariants = [...prev.variants, newVariant].sort(
          (a, b) => parseInt(a.length) - parseInt(b.length)
        );
        return {
          ...prev,
          variants: newVariants,
        };
      }
    });
  };

  const handleVariantChange = (length, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => 
        v.length === length ? { ...v, [field]: value } : v
      ),
    }));
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const newSlug = editingProduct ? formData.slug : generateSlug(name);
    
    setFormData(prev => ({
      ...prev,
      name,
      slug: newSlug,
      variants: prev.variants.map(v => ({
        ...v,
        sku: `${newSlug.toUpperCase().replace(/-/g, '')}-${v.length.replace('"', '')}`,
      })),
    }));
  };

  const handleImagesChange = (images) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    
    try {
      // Calculate if product is in stock based on variants
      const totalStock = formData.variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);
      
      const payload = {
        name: formData.name,
        slug: formData.slug,
        category_id: formData.category_id || null,
        description: formData.description || null,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        image: formData.images[0]?.url || null,
        hover_image: formData.images[1]?.url || null,
        gallery: formData.images.slice(2).map(img => img.url),
        lengths: formData.variants.map(v => v.length),
        badge_type: formData.badge_type || null,
        badge_text: formData.badge_text || null,
        in_stock: totalStock > 0,
        featured: formData.featured,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || LOW_STOCK_THRESHOLD,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        weight_unit: formData.weight_unit,
        is_archived: formData.is_archived,
        variants: formData.variants.map(v => ({
          length: v.length,
          sku: v.sku,
          quantity: parseInt(v.quantity) || 0,
          price_adjustment: parseFloat(v.price_adjustment) || 0,
        })),
      };

      const url = editingProduct 
        ? `/api/admin/products?id=${editingProduct.id}`
        : '/api/admin/products';
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      // Refresh products list
      await fetchProducts();
      handleCloseModal();
    } catch (err) {
      console.error('Save product error:', err);
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    // Find the product to check if it's archived
    const product = products.find(p => p.id === productId);
    const isArchived = product?.is_archived;
    
    const message = isArchived 
      ? 'Are you sure you want to permanently delete this product? This cannot be undone.'
      : 'Are you sure you want to delete this product? It will be moved to archive.';
    
    if (!window.confirm(message)) {
      return;
    }
    
    try {
      // If archived, permanently delete; otherwise just archive
      const url = isArchived 
        ? `/api/admin/products?id=${productId}&permanent=true`
        : `/api/admin/products?id=${productId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      await fetchProducts();
    } catch (err) {
      console.error('Delete product error:', err);
      setError('Failed to delete product');
    }
  };

  const handleArchive = async (productId) => {
    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ is_archived: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive product');
      }

      await fetchProducts();
    } catch (err) {
      console.error('Archive product error:', err);
      setError('Failed to archive product');
    }
  };

  const handleRestore = async (productId) => {
    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ is_archived: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore product');
      }

      await fetchProducts();
    } catch (err) {
      console.error('Restore product error:', err);
      setError('Failed to restore product');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  // Stats
  const stats = {
    total: products.filter(p => !p.is_archived).length,
    inStock: products.filter(p => !p.is_archived && getTotalStock(p) > 0).length,
    lowStock: products.filter(p => {
      if (p.is_archived) return false;
      const total = getTotalStock(p);
      const threshold = p.low_stock_threshold || LOW_STOCK_THRESHOLD;
      return total > 0 && total <= threshold;
    }).length,
    outOfStock: products.filter(p => !p.is_archived && getTotalStock(p) === 0).length,
    archived: products.filter(p => p.is_archived).length,
  };

  return (
    <AdminLayout title="Products" isLoading={isLoading}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>
              {activeView === 'products' ? 'Products' : 'Wishlists'}
            </h1>
            <p className={styles.subtitle}>
              {activeView === 'products' ? (
                <>
                  {stats.total} products
                  {stats.lowStock > 0 && (
                    <span className={styles.lowStockWarning}>
                      <AlertTriangle size={14} strokeWidth={1.5} />
                      {stats.lowStock} low stock
                    </span>
                  )}
                </>
              ) : (
                <>{wishlistData.length} wishlisted products</>
              )}
            </p>
          </div>
          <div className={styles.headerActions}>
            {/* View Toggle */}
            <div className={styles.viewToggle}>
              <button 
                className={`${styles.viewToggleBtn} ${activeView === 'products' ? styles.active : ''}`}
                onClick={() => setActiveView('products')}
              >
                <Package size={16} strokeWidth={1.5} />
                Products
              </button>
              <button 
                className={`${styles.viewToggleBtn} ${activeView === 'wishlists' ? styles.active : ''}`}
                onClick={() => setActiveView('wishlists')}
              >
                <Heart size={16} strokeWidth={1.5} />
                Wishlists
              </button>
            </div>
            
            {activeView === 'products' && (
              <button 
                className={styles.primaryBtn}
                onClick={() => handleOpenModal()}
              >
                <Plus size={18} strokeWidth={1.5} />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={18} strokeWidth={1.5} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Products View */}
        {activeView === 'products' && (
          <>
            {/* Stats Bar */}
            <div className={styles.statsBar}>
              <button 
                className={`${styles.statItem} ${stockFilter === 'all' && statusFilter === 'active' ? styles.active : ''}`}
                onClick={() => { setStockFilter('all'); setStatusFilter('active'); }}
              >
                <span className={styles.statValue}>{stats.total}</span>
                <span className={styles.statLabel}>All Products</span>
              </button>
              <button 
                className={`${styles.statItem} ${stockFilter === 'in-stock' ? styles.active : ''}`}
                onClick={() => { setStockFilter('in-stock'); setStatusFilter('active'); }}
              >
                <span className={`${styles.statValue} ${styles.inStock}`}>{stats.inStock}</span>
                <span className={styles.statLabel}>In Stock</span>
              </button>
              <button 
                className={`${styles.statItem} ${stockFilter === 'low-stock' ? styles.active : ''}`}
                onClick={() => { setStockFilter('low-stock'); setStatusFilter('active'); }}
              >
                <span className={`${styles.statValue} ${styles.lowStock}`}>{stats.lowStock}</span>
                <span className={styles.statLabel}>Low Stock</span>
              </button>
              <button 
                className={`${styles.statItem} ${stockFilter === 'out-of-stock' ? styles.active : ''}`}
                onClick={() => { setStockFilter('out-of-stock'); setStatusFilter('active'); }}
              >
                <span className={`${styles.statValue} ${styles.outOfStock}`}>{stats.outOfStock}</span>
                <span className={styles.statLabel}>Out of Stock</span>
              </button>
              <button 
                className={`${styles.statItem} ${statusFilter === 'archived' ? styles.active : ''}`}
                onClick={() => { setStockFilter('all'); setStatusFilter('archived'); }}
              >
                <span className={styles.statValue}>{stats.archived}</span>
                <span className={styles.statLabel}>Archived</span>
              </button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
              <div className={styles.searchWrapper}>
                <Search size={18} strokeWidth={1.5} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search products or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.select}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Products Grid */}
            <div className={styles.productsGrid}>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={styles.productCardSkeleton}>
                    <div className={styles.skeletonImage} />
                    <div className={styles.skeletonContent}>
                      <div className={styles.skeletonTitle} />
                      <div className={styles.skeletonPrice} />
                    </div>
                  </div>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className={styles.empty}>
                  <Package size={48} strokeWidth={1} />
                  <p>No products found</p>
                  {products.length === 0 && (
                    <button 
                      className={styles.primaryBtn}
                      onClick={() => handleOpenModal()}
                    >
                      <Plus size={18} strokeWidth={1.5} />
                      Add your first product
                    </button>
                  )}
                </div>
              ) : (
                filteredProducts.map(product => {
                  const stockStatus = getStockStatus(product);
                  const totalStock = getTotalStock(product);
                  
                  return (
                    <div 
                      key={product.id} 
                      className={`${styles.productCard} ${product.is_archived ? styles.archived : ''}`}
                    >
                      <div className={styles.productImage}>
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <div className={styles.noImage}>
                            <Package size={32} strokeWidth={1} />
                          </div>
                        )}
                        {product.badge_type && (
                          <span className={`${styles.badge} ${styles[`badge${product.badge_type.charAt(0).toUpperCase() + product.badge_type.slice(1)}`]}`}>
                            {product.badge_text || product.badge_type}
                          </span>
                        )}
                        {product.is_archived && (
                          <span className={styles.archivedBadge}>Archived</span>
                        )}
                      </div>
                      
                      <div className={styles.productInfo}>
                        <span className={styles.productCategory}>{getCategoryName(product.category_id)}</span>
                        <h3 className={styles.productName}>{product.name}</h3>
                        
                        <div className={styles.productPricing}>
                          <span className={styles.productPrice}>{formatUSD(product.price)}</span>
                          {product.compare_at_price && (
                            <span className={styles.productComparePrice}>{formatUSD(product.compare_at_price)}</span>
                          )}
                        </div>

                        {/* Stock Info */}
                        <div className={styles.stockInfo}>
                          <span className={`${styles.stockBadge} ${styles[stockStatus.class]}`}>
                            {stockStatus.label}
                          </span>
                          <span className={styles.stockCount}>
                            {totalStock} units
                          </span>
                        </div>

                        {/* Variant Stock Preview */}
                        {product.variants && product.variants.length > 0 && (
                          <div className={styles.variantPreview}>
                            {product.variants.slice(0, 4).map(v => (
                              <span 
                                key={v.length} 
                                className={`${styles.variantChip} ${parseInt(v.quantity) === 0 ? styles.variantOut : parseInt(v.quantity) <= (product.low_stock_threshold || LOW_STOCK_THRESHOLD) ? styles.variantLow : ''}`}
                                title={`${v.length}: ${v.quantity} in stock`}
                              >
                                {v.length}: {v.quantity}
                              </span>
                            ))}
                            {product.variants.length > 4 && (
                              <span className={styles.variantMore}>+{product.variants.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={styles.productActions}>
                        <button 
                          className={styles.editBtn}
                          onClick={() => handleOpenModal(product)}
                          title="Edit"
                        >
                          <Edit2 size={16} strokeWidth={1.5} />
                        </button>
                        {product.is_archived ? (
                          <button 
                            className={styles.restoreBtn}
                            onClick={() => handleRestore(product.id)}
                            title="Restore"
                          >
                            <RotateCcw size={16} strokeWidth={1.5} />
                          </button>
                        ) : (
                          <button 
                            className={styles.archiveBtn}
                            onClick={() => handleArchive(product.id)}
                            title="Archive"
                          >
                            <Archive size={16} strokeWidth={1.5} />
                          </button>
                        )}
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(product.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Wishlists View */}
        {activeView === 'wishlists' && (
          <div className={styles.wishlistView}>
            {wishlistLoading ? (
              <div className={styles.wishlistLoading}>
                <div className={styles.spinner} />
                <p>Loading wishlist data...</p>
              </div>
            ) : wishlistData.length === 0 ? (
              <div className={styles.wishlistEmpty}>
                <Heart size={48} strokeWidth={1} />
                <h3>No Wishlist Data Yet</h3>
                <p>When customers save products to their wishlists, you will see the most popular items here.</p>
              </div>
            ) : (
              <>
                <div className={styles.wishlistSummary}>
                  <div className={styles.wishlistStat}>
                    <span className={styles.wishlistStatValue}>
                      {wishlistStats.totalSaves}
                    </span>
                    <span className={styles.wishlistStatLabel}>Total Saves</span>
                  </div>
                  <div className={styles.wishlistStat}>
                    <span className={styles.wishlistStatValue}>
                      {wishlistStats.totalUniqueVisitors}
                    </span>
                    <span className={styles.wishlistStatLabel}>Unique Visitors</span>
                  </div>
                  <div className={styles.wishlistStat}>
                    <span className={styles.wishlistStatValue}>{wishlistStats.productsWishlisted}</span>
                    <span className={styles.wishlistStatLabel}>Products Saved</span>
                  </div>
                </div>

                <div className={styles.wishlistTable}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Wishlist Count</th>
                        <th>Unique Visitors</th>
                        <th>Stock Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wishlistData.map((product, index) => (
                        <tr key={product.id}>
                          <td>
                            <span className={`${styles.rank} ${index < 3 ? styles.topRank : ''}`}>
                              #{index + 1}
                            </span>
                          </td>
                          <td>
                            <div className={styles.wishlistProduct}>
                              {product.image && (
                                <img src={product.image} alt={product.name} className={styles.wishlistProductImage} />
                              )}
                              <span className={styles.wishlistProductName}>{product.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.categoryBadge}>
                              {product.category || 'Uncategorized'}
                            </span>
                          </td>
                          <td>{formatUSD(product.price)}</td>
                          <td>
                            <span className={styles.wishlistCount}>
                              <Heart size={14} strokeWidth={1.5} />
                              {product.wishlist_count || 0}
                            </span>
                          </td>
                          <td>{product.unique_visitors || 0}</td>
                          <td>
                            <span className={`${styles.stockStatus} ${product.in_stock ? styles.inStockStatus : styles.outOfStockStatus}`}>
                              {product.in_stock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Product Modal */}
        {showModal && (
          <>
            <div className={styles.modalBackdrop} onClick={handleCloseModal} />
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
                <button className={styles.modalClose} onClick={handleCloseModal}>
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className={styles.modalBody}>
                {/* Form Error */}
                {formError && (
                  <div className={styles.formError}>
                    <AlertCircle size={16} strokeWidth={1.5} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Basic Info */}
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Basic Information</h3>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleNameChange}
                        className={styles.formInput}
                        placeholder="e.g., Brazilian Body Wave"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Slug</label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="brazilian-body-wave"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Category</label>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className={styles.formSelect}
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={styles.formTextarea}
                      placeholder="Product description..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Pricing</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Price (USD) *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Compare at Price</label>
                      <input
                        type="number"
                        name="compare_at_price"
                        value={formData.compare_at_price}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Cost Price</label>
                      <input
                        type="number"
                        name="cost_price"
                        value={formData.cost_price}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Product Images</h3>
                  <ImageUpload
                    images={formData.images}
                    onChange={handleImagesChange}
                    maxImages={5}
                    folder="products"
                    label=""
                    helpText="Upload up to 5 images. First image is the main image, second is hover image. JPG, PNG, WebP. Max 5MB."
                  />
                </div>

                {/* Inventory - Variants */}
                <div className={styles.formSection}>
                  <button 
                    type="button"
                    className={styles.sectionToggle}
                    onClick={() => setExpandedInventory(!expandedInventory)}
                  >
                    <h3 className={styles.formSectionTitle}>Inventory & Variants</h3>
                    {expandedInventory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {expandedInventory && (
                    <>
                      {/* Length Selection */}
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Available Lengths</label>
                        <p className={styles.formHint}>Select lengths to create variants with individual stock tracking</p>
                        <div className={styles.lengthOptions}>
                          {lengthOptions.map(length => {
                            const isSelected = formData.variants.some(v => v.length === length);
                            return (
                              <button
                                key={length}
                                type="button"
                                className={`${styles.lengthOption} ${isSelected ? styles.lengthOptionActive : ''}`}
                                onClick={() => handleLengthToggle(length)}
                              >
                                {length}
                                {isSelected && <Check size={14} strokeWidth={2} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Variant Details */}
                      {formData.variants.length > 0 && (
                        <div className={styles.variantsTable}>
                          <div className={styles.variantsHeader}>
                            <span>Length</span>
                            <span>SKU</span>
                            <span>Quantity</span>
                            <span>Price Adj.</span>
                          </div>
                          {formData.variants.map(variant => (
                            <div key={variant.length} className={styles.variantRow}>
                              <span className={styles.variantLength}>{variant.length}</span>
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => handleVariantChange(variant.length, 'sku', e.target.value)}
                                className={styles.variantInput}
                                placeholder="SKU"
                              />
                              <input
                                type="number"
                                value={variant.quantity}
                                onChange={(e) => handleVariantChange(variant.length, 'quantity', e.target.value)}
                                className={`${styles.variantInput} ${parseInt(variant.quantity) === 0 ? styles.inputWarning : ''}`}
                                placeholder="0"
                                min="0"
                              />
                              <input
                                type="number"
                                value={variant.price_adjustment || 0}
                                onChange={(e) => handleVariantChange(variant.length, 'price_adjustment', e.target.value)}
                                className={styles.variantInput}
                                placeholder="0.00"
                                step="0.01"
                              />
                            </div>
                          ))}
                          <div className={styles.variantsFooter}>
                            <span>Total Stock:</span>
                            <span className={styles.totalStock}>
                              {formData.variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0)} units
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Low Stock Threshold */}
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Low Stock Threshold</label>
                          <input
                            type="number"
                            name="low_stock_threshold"
                            value={formData.low_stock_threshold}
                            onChange={handleInputChange}
                            className={styles.formInput}
                            placeholder="3"
                            min="0"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Weight</label>
                          <div className={styles.inputWithSuffix}>
                            <input
                              type="number"
                              name="weight"
                              value={formData.weight}
                              onChange={handleInputChange}
                              className={styles.formInput}
                              placeholder="0"
                              min="0"
                              step="0.01"
                            />
                            <select
                              name="weight_unit"
                              value={formData.weight_unit}
                              onChange={handleInputChange}
                              className={styles.suffixSelect}
                            >
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="oz">oz</option>
                              <option value="lb">lb</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Badge */}
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Badge (Optional)</h3>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Badge Type</label>
                      <select
                        name="badge_type"
                        value={formData.badge_type}
                        onChange={handleInputChange}
                        className={styles.formSelect}
                      >
                        <option value="">None</option>
                        <option value="bestseller">Bestseller</option>
                        <option value="new">New</option>
                        <option value="sale">Sale</option>
                        <option value="limited">Limited</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Badge Text</label>
                      <input
                        type="text"
                        name="badge_text"
                        value={formData.badge_text}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="e.g., Bestseller, -20%, New"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Status</h3>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleInputChange}
                      />
                      <span className={styles.checkboxMark} />
                      <span>Featured Product</span>
                    </label>

                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        name="is_archived"
                        checked={formData.is_archived}
                        onChange={handleInputChange}
                      />
                      <span className={styles.checkboxMark} />
                      <span>Archived (Hidden from store)</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    className={styles.cancelBtn}
                    onClick={handleCloseModal}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;