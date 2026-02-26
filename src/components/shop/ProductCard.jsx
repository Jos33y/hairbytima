import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrencyStore } from '@/store/currencyStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import styles from '@/styles/module/ProductCard.module.css';  

const ProductCard = ({ product, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Currency formatting
  const { formatPrice } = useCurrencyStore();
  
  // Wishlist functionality
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();
  const isWishlisted = wishlistItems.some(item => item.id === product.id);
  
  // Cart functionality
  const addToCart = useCartStore((state) => state.addItem);

  const {
    id,
    name,
    slug,
    price,
    compareAtPrice,
    image,
    hoverImage,
    inStock,
    badge,
  } = product;

  const isOnSale = compareAtPrice && compareAtPrice > price;
  const discountPercent = isOnSale 
    ? Math.round((1 - price / compareAtPrice) * 100) 
    : 0;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inStock) {
      addToCart(product);
    }
  };

  // Badge color mapping
  const badgeColors = {
    bestseller: { bg: 'var(--accent-primary)', text: 'white' },
    new: { bg: 'var(--accent-gold)', text: 'var(--bg-primary)' },
    sale: { bg: 'var(--error)', text: 'white' },
    limited: { bg: 'var(--warning)', text: 'var(--bg-primary)' },
  };

  const badgeStyle = badge?.type ? badgeColors[badge.type] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <Link 
        to={`/product/${slug}`}
        className={styles.card}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className={styles.imageWrapper}>
          {/* Main Image */}
          <motion.img
            src={image}
            alt={name}
            className={styles.image}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            animate={{ 
              opacity: isHovered && hoverImage ? 0 : 1,
              scale: isHovered ? 1.05 : 1
            }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Hover Image */}
          {hoverImage && (
            <motion.img
              src={hoverImage}
              alt={`${name} alternate view`}
              className={styles.hoverImage}
              loading="lazy"
              animate={{ 
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1.05 : 1.1
              }}
              transition={{ duration: 0.4 }}
            />
          )}

          {/* Loading Shimmer */}
          {!imageLoaded && (
            <div className={styles.imageShimmer} />
          )}

          {/* Badge */}
          {badge?.type && badgeStyle && (
            <motion.div 
              className={styles.badge}
              style={{ 
                background: badgeStyle.bg, 
                color: badgeStyle.text 
              }}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {badge.text || badge.type.toUpperCase()}
            </motion.div>
          )}

          {/* Sale Badge */}
          {isOnSale && !badge?.type && (
            <motion.div 
              className={styles.saleBadge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              -{discountPercent}%
            </motion.div>
          )}

          {/* Sold Out Overlay */}
          {!inStock && (
            <div className={styles.soldOut}>
              <span>Sold Out</span>
            </div>
          )}

          {/* Quick Actions */}
          <motion.div 
            className={styles.actions}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              className={`${styles.actionBtn} ${isWishlisted ? styles.wishlisted : ''}`}
              onClick={handleWishlist}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart 
                size={18} 
                fill={isWishlisted ? 'currentColor' : 'none'}
                strokeWidth={1.5}
              />
            </motion.button>
            
            <motion.button
              className={styles.actionBtn}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Quick view"
            >
              <Eye size={18} strokeWidth={1.5} />
            </motion.button>
          </motion.div>

          {/* Add to Cart Button */}
          <motion.div
            className={styles.addToCart}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isHovered && inStock ? 1 : 0,
              y: isHovered && inStock ? 0 : 20
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <motion.button 
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingBag size={16} strokeWidth={1.5} />
              <span>Add to Bag</span>
            </motion.button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className={styles.info}>
          <h3 className={styles.name}>{name}</h3>
          
          <div className={styles.pricing}>
            <span className={styles.price}>
              {formatPrice(price)}
            </span>
            {isOnSale && (
              <span className={styles.comparePrice}>
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Hover Glow Effect */}
        <motion.div 
          className={styles.glowEffect} 
          animate={{ 
            opacity: isHovered ? 0.6 : 0,
            scale: isHovered ? 1 : 0.8
          }}
          transition={{ duration: 0.4 }}
        />
      </Link>
    </motion.div>
  );
};

export default ProductCard;