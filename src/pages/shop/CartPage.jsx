// ==========================================================================
// CartPage - Premium Visual Experience with Micro-interactions
// ==========================================================================
// Uses cartStore for coupon persistence (carries to checkout)
// ==========================================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft,
  Heart,
  Tag,
  X,
  Check,
  Shield,
  Lock,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@components/common';
import { useCartStore } from '@store/cartStore';
import { useWishlistStore } from '@store/wishlistStore';
import { useCurrencyStore } from '@store/currencyStore';
import { couponService } from '@services/couponService';
import { trackViewCart } from '@utils/analytics';
import styles from '@styles/module/CartPage.module.css'; 

// ==========================================================================
// Animated Number Component - Smooth counting animation
// ==========================================================================
const AnimatedPrice = ({ value, format }) => {
  const springValue = useSpring(value, { 
    stiffness: 100, 
    damping: 20,
    mass: 0.5
  });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    springValue.set(value);
    const unsubscribe = springValue.on('change', (v) => {
      setDisplayValue(v);
    });
    return () => unsubscribe();
  }, [value, springValue]);

  return <span>{format(displayValue)}</span>;
};

// ==========================================================================
// Quantity Button with tactile feedback
// ==========================================================================
const QuantityButton = ({ onClick, disabled, children }) => (
  <motion.button
    className={styles.quantityBtn}
    onClick={onClick}
    disabled={disabled}
    whileHover={{ scale: disabled ? 1 : 1.1 }}
    whileTap={{ scale: disabled ? 1 : 0.85 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  >
    {children}
  </motion.button>
);

// ==========================================================================
// Main CartPage Component
// ==========================================================================
const CartPage = () => {
  const navigate = useNavigate();
  
  // Stores - GET COUPON FROM CARTSTORE (persisted!)
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    getSubtotal, 
    getTotalSavings,
    clearCart,
    // Coupon from store (persisted)
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    recalculateDiscount,
  } = useCartStore();
  const { formatPrice } = useCurrencyStore();
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlistStore();

  // Local UI state only (not persisted)
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [removingItem, setRemovingItem] = useState(null);

  // Calculations
  const subtotal = getSubtotal();
  const totalSavings = getTotalSavings();
  const total = subtotal - couponDiscount;

  // Track view cart (only when there are items)
  useEffect(() => {
    if (items.length > 0) {
      trackViewCart(items, subtotal);
    }
  }, []); // Only track on initial mount

  // Recalculate coupon discount when cart changes
  useEffect(() => {
    recalculateDiscount();
  }, [subtotal, recalculateDiscount]);

  // Apply coupon with celebration
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const result = await couponService.validate(couponCode.trim(), subtotal);

      if (result.valid) {
        // Store in cartStore (persisted!)
        applyCoupon({
          id: result.coupon.id,
          code: result.coupon.code,
          discountType: result.coupon.discount_type,
          discountValue: parseFloat(result.coupon.discount_value),
          maxDiscount: result.coupon.max_discount ? parseFloat(result.coupon.max_discount) : null,
          minOrderValue: result.coupon.min_order_value ? parseFloat(result.coupon.min_order_value) : null,
          isFreeShipping: result.coupon.discount_type === 'free_shipping',
        }, result.discount);
        
        setCouponCode('');
        setCouponSuccess(true);
        setTimeout(() => setCouponSuccess(false), 2000);
      } else {
        setCouponError(result.error);
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon (from cartStore)
  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError('');
  };

  // Handle item removal with animation
  const handleRemoveItem = (itemId, itemLength) => {
    setRemovingItem(`${itemId}-${itemLength}`);
    setTimeout(() => {
      removeItem(itemId, itemLength);
      setRemovingItem(null);
    }, 300);
  };

  // Toggle wishlist (keeps item in cart)
  const handleToggleWishlist = (item) => {
    toggleWishlist({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      image: item.image,
      inStock: true,
    });
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <motion.div 
            className={styles.empty}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.emptyContent}>
              <motion.div 
                className={styles.emptyIcon}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2, 
                  type: 'spring', 
                  stiffness: 200,
                  damping: 15 
                }}
              >
                <ShoppingBag size={36} strokeWidth={1.2} />
              </motion.div>
              <motion.h1 
                className={styles.emptyTitle}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your cart is empty
              </motion.h1>
              <motion.p 
                className={styles.emptyText}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Discover our premium collection and find your perfect look.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link to="/shop">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
                      Explore Collection
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.page}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.container}>
        {/* Header */}
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Shopping Cart</h1>
            <motion.span 
              className={styles.itemCount}
              key={items.length}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </motion.span>
          </div>
          <AnimatePresence>
            {totalSavings > 0 && (
              <motion.div 
                className={styles.savingsBadge}
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles size={14} />
                </motion.div>
                <span>Saving {formatPrice(totalSavings)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className={styles.content}>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            {/* Desktop Header */}
            <motion.div 
              className={styles.tableHeader}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className={styles.colProduct}>Product</span>
              <span className={styles.colPrice}>Price</span>
              <span className={styles.colQuantity}>Quantity</span>
              <span className={styles.colTotal}>Total</span>
              <span className={styles.colActions}></span>
            </motion.div>

            {/* Items */}
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div 
                  key={`${item.id}-${item.length}`} 
                  className={`${styles.cartItem} ${removingItem === `${item.id}-${item.length}` ? styles.removing : ''}`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ 
                    opacity: 0, 
                    x: -50, 
                    height: 0, 
                    marginBottom: 0, 
                    paddingTop: 0, 
                    paddingBottom: 0,
                    transition: { duration: 0.3 }
                  }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.05,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  layout
                >
                  {/* Product */}
                  <div className={styles.product}>
                    <Link to={`/product/${item.slug || item.id}`}>
                      <motion.div 
                        className={styles.productImage}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <img src={item.image} alt={item.name} loading="lazy" />
                        <div className={styles.imageOverlay} />
                      </motion.div>
                    </Link>
                    <div className={styles.productInfo}>
                      <Link to={`/product/${item.slug || item.id}`} className={styles.productName}>
                        {item.name}
                      </Link>
                      {item.length && (
                        <span className={styles.productMeta}>Length: {item.length}</span>
                      )}
                      {/* Mobile Price */}
                      <div className={styles.mobilePrice}>
                        <span>{formatPrice(item.price)}</span>
                        {item.compareAtPrice && item.compareAtPrice > item.price && (
                          <span className={styles.mobileComparePrice}>{formatPrice(item.compareAtPrice)}</span>
                        )}
                      </div>
                      {/* Mobile Actions */}
                      <motion.button 
                        className={`${styles.mobileWishlist} ${isInWishlist(item.id) ? styles.inWishlist : ''}`}
                        onClick={() => handleToggleWishlist(item)}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Heart 
                          size={12} 
                          fill={isInWishlist(item.id) ? 'currentColor' : 'none'}
                        />
                        {isInWishlist(item.id) ? 'Saved' : 'Save for later'}
                      </motion.button>
                    </div>
                  </div>

                  {/* Price (Desktop) */}
                  <div className={styles.price}>
                    <span>{formatPrice(item.price)}</span>
                    {item.compareAtPrice && item.compareAtPrice > item.price && (
                      <span className={styles.comparePrice}>{formatPrice(item.compareAtPrice)}</span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className={styles.quantity}>
                    <div className={styles.quantitySelector}>
                      <QuantityButton
                        onClick={() => updateQuantity(item.id, item.length, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} strokeWidth={2.5} />
                      </QuantityButton>
                      <motion.span 
                        className={styles.quantityValue}
                        key={item.quantity}
                        initial={{ scale: 1.3, color: 'var(--accent-primary)' }}
                        animate={{ scale: 1, color: 'var(--text-primary)' }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.quantity}
                      </motion.span>
                      <QuantityButton
                        onClick={() => updateQuantity(item.id, item.length, item.quantity + 1)}
                        disabled={item.quantity >= 10}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                      </QuantityButton>
                    </div>
                  </div>

                  {/* Total */}
                  <div className={styles.itemTotal}>
                    <AnimatedPrice 
                      value={item.price * item.quantity} 
                      format={formatPrice} 
                    />
                  </div>

                  {/* Actions */}
                  <div className={styles.actions}>
                    <motion.button 
                      className={`${styles.actionBtn} ${isInWishlist(item.id) ? styles.inWishlist : ''}`}
                      onClick={() => handleToggleWishlist(item)}
                      aria-label={isInWishlist(item.id) ? 'Remove from wishlist' : 'Save for later'}
                      title={isInWishlist(item.id) ? 'Saved to wishlist' : 'Save for later'}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart 
                        size={16} 
                        strokeWidth={1.5} 
                        fill={isInWishlist(item.id) ? 'currentColor' : 'none'}
                      />
                    </motion.button>
                    <motion.button 
                      className={styles.removeBtn}
                      onClick={() => handleRemoveItem(item.id, item.length)}
                      aria-label="Remove"
                      title="Remove"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Cart Actions */}
            <motion.div 
              className={styles.cartActions}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/shop" className={styles.continueShopping}>
                <motion.span
                  className={styles.continueInner}
                  whileHover={{ x: -4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <ArrowLeft size={14} />
                  Continue Shopping
                </motion.span>
              </Link>
              <motion.button 
                className={styles.clearCart} 
                onClick={clearCart}
                whileHover={{ color: '#ef4444' }}
                whileTap={{ scale: 0.95 }}
              >
                Clear Cart
              </motion.button>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className={styles.summaryWrapper}>
            <motion.div 
              className={styles.summary}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Gradient border effect */}
              <div className={styles.summaryGlow} />
              
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              
              {/* Coupon Input */}
              <div className={styles.couponSection}>
                {!appliedCoupon ? (
                  <>
                    <motion.div 
                      className={styles.couponInput}
                      whileFocus={{ borderColor: 'var(--accent-primary)' }}
                    >
                      <Tag size={14} className={styles.couponIcon} />
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        disabled={couponLoading}
                      />
                      <motion.button 
                        className={styles.couponApply}
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {couponLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 size={14} />
                          </motion.div>
                        ) : 'Apply'}
                      </motion.button>
                    </motion.div>
                    <AnimatePresence>
                      {couponError && (
                        <motion.p 
                          className={styles.couponError}
                          initial={{ opacity: 0, y: -8, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -8, height: 0 }}
                        >
                          <AlertCircle size={12} />
                          {couponError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <motion.div 
                    className={`${styles.appliedCoupon} ${couponSuccess ? styles.celebrate : ''}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div className={styles.appliedCouponInfo}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                      >
                        <Check size={14} />
                      </motion.div>
                      <div>
                        <span className={styles.appliedCode}>{appliedCoupon.code}</span>
                        <span className={styles.appliedDiscount}>
                          {appliedCoupon.discountType === 'percentage' 
                            ? `${appliedCoupon.discountValue}% off`
                            : appliedCoupon.discountType === 'free_shipping'
                            ? 'Free shipping'
                            : `${formatPrice(appliedCoupon.discountValue)} off`
                          }
                        </span>
                      </div>
                    </div>
                    <motion.button 
                      className={styles.removeCoupon}
                      onClick={handleRemoveCoupon}
                      aria-label="Remove coupon"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={14} />
                    </motion.button>
                  </motion.div>
                )}
              </div>

              {/* Summary Rows */}
              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span className={styles.summaryValue}>
                    <AnimatedPrice value={subtotal} format={formatPrice} />
                  </span>
                </div>
                
                <AnimatePresence>
                  {totalSavings > 0 && (
                    <motion.div 
                      className={`${styles.summaryRow} ${styles.savingsRow}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <span>Product Savings</span>
                      <span>-<AnimatedPrice value={totalSavings} format={formatPrice} /></span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {couponDiscount > 0 && (
                    <motion.div 
                      className={`${styles.summaryRow} ${styles.discountRow}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <span>Coupon Discount</span>
                      <span>-<AnimatedPrice value={couponDiscount} format={formatPrice} /></span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span className={styles.shippingCalc}>Calculated at checkout</span>
                </div>
              </div>

              {/* Total */}
              <motion.div 
                className={styles.summaryTotal}
                key={total}
              >
                <span>Total</span>
                <motion.span 
                  className={styles.totalValue}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <AnimatedPrice value={total} format={formatPrice} />
                </motion.span>
              </motion.div>

              {/* Checkout Button */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={styles.checkoutBtnWrapper}
              >
                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth 
                  rightIcon={<ArrowRight size={16} />}
                  onClick={() => navigate('/checkout')}
                  className={styles.checkoutBtn}
                >
                  Proceed to Checkout
                </Button>
                <div className={styles.btnShimmer} />
              </motion.div>

              {/* Trust Badges */}
              <div className={styles.trustBadges}>
                <motion.div 
                  className={styles.trustBadge}
                  whileHover={{ y: -2 }}
                >
                  <Lock size={12} />
                  <span>Secure Checkout</span>
                </motion.div>
                <motion.div 
                  className={styles.trustBadge}
                  whileHover={{ y: -2 }}
                >
                  <Shield size={12} />
                  <span>Quality Guarantee</span>
                </motion.div>
              </div>

              {/* Payment Methods */}
              <div className={styles.paymentMethods}>
                <span>We accept</span>
                <div className={styles.paymentIcons}>
                  <span>Klarna</span>
                  <span>Bank Transfer</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout */}
      <motion.div 
        className={styles.mobileSticky}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className={styles.mobileStickyInfo}>
          <span className={styles.mobileStickyLabel}>Total</span>
          <span className={styles.mobileStickyTotal}>
            <AnimatedPrice value={total} format={formatPrice} />
          </span>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            variant="primary" 
            size="md"
            rightIcon={<ArrowRight size={14} />}
            onClick={() => navigate('/checkout')}
          >
            Checkout
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default CartPage;