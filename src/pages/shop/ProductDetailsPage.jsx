// ==========================================================================
// ProductDetailsPage - Fixed with clean URLs, image lightbox, compact tabs
// ==========================================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Heart, 
  Minus, 
  Plus, 
  Check, 
  Ruler,
  Clock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Share2,
  Package,
  Droplets,
  ArrowRight
} from 'lucide-react';
import { Button } from '@components/common';
import { 
  ProductCard, 
  ProductLoader, 
  LengthGuide, 
  ProductReviews,
  ImageLightbox 
} from '@components/shop';
import { useCartStore } from '@store/cartStore';
import { useWishlistStore } from '@store/wishlistStore';
import { useCurrencyStore } from '@store/currencyStore';
import { productService } from '@services/productService';
import { trustFeatures, productTabs, getCareInstructions } from '@constants/productConstants';
import { trackProductView, trackAddToCart } from '@utils/analytics';
import styles from '@styles/module/ProductDetailsPage.module.css'; 

const ProductDetailsPage = () => { 
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // State
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLength, setSelectedLength] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isLengthGuideOpen, setIsLengthGuideOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  
  // Refs
  const imageRef = useRef(null);
  const hasTrackedView = useRef(false);

  // Stores
  const addItem = useCartStore((state) => state.addItem);
  const { formatPrice } = useCurrencyStore();
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const wishlistItems = useWishlistStore((state) => state.items);

  // Fetch product data from Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      setError(null);
      hasTrackedView.current = false; // Reset tracking flag for new product
      
      try {
        // Fetch product from Supabase
        const productData = await productService.getBySlug(slug);
        
        if (!productData) {
          setError('Product not found');
          setIsLoading(false);
          return;
        }
        
        setProduct(productData);
        
        // Auto-select first available length
        if (productData.lengths?.length > 0) {
          setSelectedLength(productData.lengths[0]);
        }
        
        // Fetch related products from same category
        if (productData.category?.id) {
          const related = await productService.getByCategory(productData.category.id, 4);
          // Filter out current product from related
          setRelatedProducts(related.filter(p => p.id !== productData.id).slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    
    // Reset state when slug changes
    setActiveImage(0);
    setQuantity(1);
    setActiveTab('description');
    setSelectedLength(null);
  }, [slug]);

  // Track product view (separate effect to run after product is loaded)
  useEffect(() => {
    if (product && !hasTrackedView.current) {
      trackProductView(product);
      hasTrackedView.current = true;
    }
  }, [product]);

  // Check wishlist status
  const isInWishlist = product ? wishlistItems.some(item => item.id === product.id) : false;

  // Handlers
  const handleWishlistToggle = () => {
    if (product) toggleWishlist(product);
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleAddToCart = () => {
    if (!selectedLength && product.lengths?.length > 0) {
      // Could add toast notification here
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.image,
      length: selectedLength,
      quantity,
    };

    addItem(cartItem);
    
    // Track add to cart
    trackAddToCart(product, quantity);

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleImageNav = (direction) => {
    const images = getProductImages();
    if (direction === 'next') {
      setActiveImage((prev) => (prev + 1) % images.length);
    } else {
      setActiveImage((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleImageClick = () => {
    setIsLightboxOpen(true);
  };

  const handleLightboxNavigate = (index) => {
    setActiveImage(index);
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Could add toast: "Link copied!"
    }
  };

  // Get product images array
  const getProductImages = () => {
    if (!product) return [];
    const images = [product.image];
    if (product.hoverImage) images.push(product.hoverImage);
    if (product.gallery?.length > 0) {
      images.push(...product.gallery.map(g => g.url || g));
    }
    return images.filter(Boolean);
  };

  // Loading state
  if (isLoading) {
    return <ProductLoader />;
  }

  // Error or not found state
  if (error || !product) {
    return (
      <div className={styles.notFound}>
        <Package size={64} strokeWidth={1} />
        <h1>Product Not Found</h1>
        <p>The product you're looking for doesn't exist or has been removed.</p>
        <Button variant="primary" onClick={() => navigate('/shop')}>
          Back to Shop
        </Button>
      </div>
    );
  }

  const images = getProductImages();
  const instructions = getCareInstructions(product.category?.name);

  return (
    <motion.div 
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.container}>
        {/* Breadcrumb - Fixed with clean URLs */}
        <motion.nav 
          className={styles.breadcrumb}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link to="/" className={styles.breadcrumbLink}>Home</Link>
          <span className={styles.separator}>/</span>
          <Link to="/shop" className={styles.breadcrumbLink}>Shop</Link>
          <span className={styles.separator}>/</span>
          {product.category?.slug && (
            <>
              <Link to={`/shop/${product.category.slug}`} className={styles.breadcrumbLink}>
                {product.category.name}
              </Link>
              <span className={styles.separator}>/</span>
            </>
          )}
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </motion.nav>

        {/* Product Grid */}
        <div className={styles.productGrid}>
          {/* Gallery */}
          <motion.div 
            className={styles.gallery}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Main Image */}
            <div className={styles.mainImage} ref={imageRef}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={images[activeImage]}
                  alt={product.name}
                  className={styles.productImage}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  onClick={handleImageClick}
                />
              </AnimatePresence>
              
              {/* Badges */}
              <div className={styles.badges}>
                {product.isNew && (
                  <span className={styles.badgeNew}>New</span>
                )}
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className={styles.badgeSale}>
                    -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Zoom Button */}
              <button 
                className={styles.zoomBtn}
                onClick={handleImageClick}
                aria-label="Zoom image"
              >
                <ZoomIn size={18} strokeWidth={1.5} />
              </button>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button 
                    className={`${styles.navBtn} ${styles.prevBtn}`}
                    onClick={() => handleImageNav('prev')}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} strokeWidth={1.5} />
                  </button>
                  <button 
                    className={`${styles.navBtn} ${styles.nextBtn}`}
                    onClick={() => handleImageNav('next')}
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} strokeWidth={1.5} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className={styles.thumbnails}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`${styles.thumbnail} ${idx === activeImage ? styles.thumbnailActive : ''}`}
                    onClick={() => setActiveImage(idx)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div 
            className={styles.info}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Category & Title */}
            {product.category?.name && (
              <span className={styles.category}>{product.category.name}</span>
            )}
            <h1 className={styles.title}>{product.name}</h1>

            {/* Price */}
            <div className={styles.priceWrapper}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className={styles.comparePrice}>
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className={styles.saveBadge}>
                    Save {formatPrice(product.compareAtPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            <p className={styles.shortDesc}>
              {product.shortDescription || product.description?.substring(0, 150)}
            </p>

            {/* Trust Features */}
            <div className={styles.trustFeatures}>
  {trustFeatures.map((feature, idx) => (
    <div key={idx} className={styles.trustItem}>
      <feature.icon size={16} strokeWidth={1.5} />
      <div>
        <span className={styles.trustTitle}>{feature.title}</span>
        <span className={styles.trustDesc}>{feature.desc}</span>
      </div>
    </div>
  ))}
</div>

            {/* Length Selector */}
            {product.lengths?.length > 0 && (
              <div className={styles.lengthSelector}>
                <div className={styles.lengthHeader}>
                  <span className={styles.lengthLabel}>
                    Length: <strong>{selectedLength || 'Select'}</strong>
                  </span>
                  <button 
                    className={styles.guideBtn}
                    onClick={() => setIsLengthGuideOpen(true)}
                  >
                    <Ruler size={14} strokeWidth={1.5} />
                    Length Guide
                  </button>
                </div>
                <div className={styles.lengthOptions}>
                  {product.lengths.map((len) => (
                    <button
                      key={len}
                      className={`${styles.lengthOption} ${selectedLength === len ? styles.lengthSelected : ''}`}
                      onClick={() => setSelectedLength(len)}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className={styles.quantityWrapper}>
              <span className={styles.quantityLabel}>Quantity</span>
              <div className={styles.quantitySelector}>
                <button 
                  className={styles.quantityBtn}
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} strokeWidth={2} />
                </button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button 
                  className={styles.quantityBtn}
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                disabled={!product.inStock}
                leftIcon={addedToCart ? <Check size={20} /> : <ShoppingBag size={20} />}
                className={addedToCart ? styles.addedBtn : ''}
              >
                {!product.inStock 
                  ? 'Sold Out' 
                  : addedToCart 
                    ? 'Added!' 
                    : 'Add to Cart'
                }
              </Button>
              <button 
                className={`${styles.wishlistBtn} ${isInWishlist ? styles.wishlisted : ''}`}
                onClick={handleWishlistToggle}
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart 
                  size={20} 
                  strokeWidth={1.5} 
                  fill={isInWishlist ? 'currentColor' : 'none'}
                />
              </button>
              <button 
                className={styles.shareBtn}
                onClick={handleShare}
                aria-label="Share product"
              >
                <Share2 size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Stock Status */}
            <div className={styles.stockStatus}>
              {product.inStock ? (
                <span className={styles.inStock}>
                  <Check size={14} strokeWidth={2} />
                  In Stock — Ready to Ship
                </span>
              ) : (
                <span className={styles.outOfStock}>
                  <Clock size={14} strokeWidth={2} />
                  Out of Stock
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Product Tabs - Compact */}
        <motion.section 
          className={styles.tabsSection}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.tabsNav}>
            {productTabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.tabPane}
                >
                  <h3>About This Product</h3>
                  <p>{product.description}</p>
                  
                  <div className={styles.specs}>
                    <h4>Specifications</h4>
                    <div className={styles.specsGrid}>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Material</span>
                        <span className={styles.specValue}>100% Luxury Human Hair</span>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Texture</span>
                        <span className={styles.specValue}>{product.texture || product.category?.name}</span>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Weight</span>
                        <span className={styles.specValue}>100g per bundle</span>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}>Color</span>
                        <span className={styles.specValue}>{product.color || 'Natural Black'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'care' && (
                <motion.div
                  key="care"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.tabPane}
                >
                  <h3>Care Instructions</h3>
                  <p>Follow these guidelines to maintain your hair extensions and maximize their lifespan.</p>
                  
                  <ul className={styles.careList}>
                    {instructions.slice(0, 4).map((instruction, i) => (
                      <li key={i}>
                        <Check size={16} strokeWidth={2} />
                        {instruction}
                      </li>
                    ))}
                  </ul>

                  <div className={styles.careNote}>
                    <Droplets size={20} strokeWidth={1.5} />
                    <p>
                      For detailed care instructions, visit our{' '}
                      <Link to="/hair-care">Hair Care Guide</Link>.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'shipping' && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.tabPane}
                >
                  <h3>Shipping & Returns</h3>
                  
                  <div className={styles.policyLinks}>
                    <p>For complete details, see our policies:</p>
                    <div className={styles.policyBtns}>
                      <Link to="/shipping-policy" className={styles.policyLink}>
                        Shipping Policy
                        <ArrowRight size={14} strokeWidth={2} />
                      </Link>
                      <Link to="/return-policy" className={styles.policyLink}>
                        Return Policy
                        <ArrowRight size={14} strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.section 
            className={styles.related}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className={styles.relatedTitle}>You May Also Like</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Length Guide Modal */}
      <LengthGuide 
        isOpen={isLengthGuideOpen} 
        onClose={() => setIsLengthGuideOpen(false)} 
      />

      {/* Image Lightbox Modal */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        activeIndex={activeImage}
        onNavigate={handleLightboxNavigate}
        productName={product.name}
      />

      {/* Mobile Sticky Add to Cart */}
      <div className={styles.mobileSticky}>
        <div className={styles.mobileStickyPrice}>
          <span className={styles.mobileStickyName}>{product.name}</span>
          <span className={styles.mobileStickyAmount}>{formatPrice(product.price)}</span>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleAddToCart}
          disabled={!product.inStock}
          leftIcon={addedToCart ? <Check size={18} /> : <ShoppingBag size={18} />}
        >
          {addedToCart ? 'Added!' : 'Add to Cart'}
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductDetailsPage;