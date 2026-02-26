// ==========================================================================
// Shared Wishlist Page - View-only wishlist shared by another user
// ==========================================================================

import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@store/cartStore';
import { useWishlistStore } from '@store/wishlistStore';
import { useCurrencyStore } from '@store/currencyStore';
import { wishlistService } from '@services/wishlistService';
import { WishlistLoader } from '@components/shop';
import styles from '@styles/module/WishlistPage.module.css'; 

export default function SharedWishlistPage() {
  const { visitorId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const addToCart = useCartStore(state => state.addItem);
  const { addItem: addToWishlist, isInWishlist } = useWishlistStore();
  const formatPrice = useCurrencyStore(state => state.formatPrice);

  // Fetch shared wishlist
  useEffect(() => {
    const fetchSharedWishlist = async () => {
      if (!visitorId) {
        setError('Invalid wishlist link');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await wishlistService.getSharedWishlist(visitorId);
        setItems(data);
      } catch (err) {
        console.error('Failed to fetch shared wishlist:', err);
        setError('Could not load this wishlist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedWishlist();
  }, [visitorId]);

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
      selectedLength: null,
      quantity: 1,
    });
  };

  // Handle add to own wishlist
  const handleAddToWishlist = (item) => {
    addToWishlist(item);
  };

  // Show loader
  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <WishlistLoader />
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <motion.div 
            className={styles.emptyState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.emptyIcon}>
              <Heart size={48} strokeWidth={1} />
            </div>
            <h1 className={styles.emptyTitle}>Wishlist Not Found</h1>
            <p className={styles.emptyText}>
              {error}
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

  // Empty wishlist
  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <motion.div 
            className={styles.emptyState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.emptyIcon}>
              <Heart size={48} strokeWidth={1} />
            </div>
            <h1 className={styles.emptyTitle}>This Wishlist is Empty</h1>
            <p className={styles.emptyText}>
              The owner hasn't added any items yet.
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
        >
          <div className={styles.headerLeft}>
            <Link to="/wishlist" className={styles.backLink}>
              <ArrowLeft size={18} strokeWidth={1.5} />
            </Link>
            <div>
              <h1 className={styles.title}>Shared Wishlist</h1>
              <span className={styles.count}>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
          <div className={styles.sharedBadge}>
            <Share2 size={14} strokeWidth={1.5} />
            View Only
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div 
          className={styles.infoBanner}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Heart size={16} strokeWidth={1.5} />
          <span>Someone shared their wishlist with you! Add items to your cart or save them to your own wishlist.</span>
        </motion.div>

        {/* Wishlist Grid */}
        <motion.div 
          className={styles.grid}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {items.map((item, index) => (
            <motion.div 
              key={item.id} 
              className={styles.card}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
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
                    onClick={() => handleAddToWishlist(item)}
                    className={`${styles.wishlistBtn} ${isInWishlist(item.id) ? styles.wishlistBtnActive : ''}`}
                    aria-label="Add to my wishlist"
                  >
                    <Heart 
                      size={18} 
                      strokeWidth={1.5}
                      fill={isInWishlist(item.id) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div 
          className={styles.continueSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/wishlist" className={styles.continueBtn}>
            View My Wishlist
            <Heart size={18} strokeWidth={1.5} />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}