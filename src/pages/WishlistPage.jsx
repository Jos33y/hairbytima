// ==========================================================================
// Wishlist Page - View and manage saved products
// ==========================================================================

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, Share2, Copy, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlistStore } from '@store/wishlistStore';
import { useCartStore } from '@store/cartStore';
import { useCurrencyStore } from '@store/currencyStore';
import { WishlistLoader } from '@components/shop';
import styles from '@styles/module/WishlistPage.module.css'; 

export default function WishlistPage() {
  const navigate = useNavigate();
  const { 
    items, 
    isLoading, 
    isInitialized,
    removeItem, 
    clearWishlist, 
    initialize,
    getVisitorId 
  } = useWishlistStore();
  const addToCart = useCartStore(state => state.addItem);
  const formatPrice = useCurrencyStore(state => state.formatPrice);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize wishlist on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle add to cart
  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      image: item.image,
      category: item.category,
      selectedLength: null, // Will be selected in cart/product page
      quantity: 1,
    });
  };

  // Generate share URL
  const getShareUrl = () => {
    const visitorId = getVisitorId();
    return `${window.location.origin}/wishlist/shared/${visitorId}`;
  };

  // Copy share URL
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Show loader while initializing
  if (!isInitialized || isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <WishlistLoader />
        </div>
      </main>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <motion.div 
            className={styles.emptyState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className={styles.emptyIcon}
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Heart size={48} strokeWidth={1} />
            </motion.div>
            <h1 className={styles.emptyTitle}>Your Wishlist is Empty</h1>
            <p className={styles.emptyText}>
              Save your favorite items here to shop them later.
            </p>
            <Link to="/shop" className={styles.emptyBtn}>
              <ShoppingBag size={18} strokeWidth={1.5} />
              Browse Products
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>My Wishlist</h1>
            <span className={styles.count}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={() => setShowShareModal(true)}
              className={styles.shareBtn}
              title="Share wishlist"
            >
              <Share2 size={18} strokeWidth={1.5} />
              <span>Share</span>
            </button>
            <button 
              onClick={clearWishlist}
              className={styles.clearBtn}
            >
              Clear All
            </button>
          </div>
        </motion.div>

        {/* Wishlist Grid */}
        <motion.div 
          className={styles.grid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div 
                key={item.id} 
                className={styles.card}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ 
                  duration: 0.4,
                  delay: index * 0.05,
                }}
              >
                <Link to={`/product/${item.slug}`} className={styles.imageLink}>
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className={styles.image}
                    loading="lazy"
                  />
                  {!item.inStock && (
                    <div className={styles.outOfStock}>Out of Stock</div>
                  )}
                </Link>
                
                <div className={styles.content}>
                  <Link to={`/product/${item.slug}`} className={styles.name}>
                    {item.name}
                  </Link>
                  
                  {item.category && (
                    <span className={styles.category}>{item.category.name}</span>
                  )}
                  
                  <div className={styles.priceRow}>
                    <span className={styles.price}>{formatPrice(item.price)}</span>
                    {item.compareAtPrice && (
                      <span className={styles.comparePrice}>
                        {formatPrice(item.compareAtPrice)}
                      </span>
                    )}
                  </div>

                  <div className={styles.actions}>
                    <button 
                      onClick={() => handleAddToCart(item)}
                      className={styles.addBtn}
                      disabled={!item.inStock}
                    >
                      <ShoppingBag size={16} strokeWidth={1.5} />
                      {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className={styles.removeBtn}
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Continue Shopping */}
        <motion.div 
          className={styles.continueSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/shop" className={styles.continueBtn}>
            Continue Shopping
            <ArrowRight size={18} strokeWidth={1.5} />
          </Link>
        </motion.div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              className={styles.modal}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Share Your Wishlist</h3>
                <button 
                  className={styles.modalClose}
                  onClick={() => setShowShareModal(false)}
                >
                  ×
                </button>
              </div>
              
              <p className={styles.modalText}>
                Share your wishlist with friends and family. They can view your saved items but cannot modify them.
              </p>

              <div className={styles.shareUrlContainer}>
                <input 
                  type="text" 
                  value={getShareUrl()}
                  readOnly
                  className={styles.shareUrlInput}
                />
                <button 
                  onClick={handleCopyLink}
                  className={styles.copyBtn}
                >
                  {copied ? (
                    <>
                      <Check size={18} strokeWidth={2} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} strokeWidth={1.5} />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <p className={styles.modalHint}>
                {items.length} {items.length === 1 ? 'item' : 'items'} will be shared
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}