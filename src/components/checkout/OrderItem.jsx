// ==========================================================================
// OrderItem - Product display in order summary
// Shows compareAtPrice strikethrough when applicable
// ==========================================================================

import styles from '@styles/module/CheckoutPage.module.css';

export const OrderItem = ({ item, formatPrice }) => {
  const itemTotal = item.price * item.quantity;
  const hasDiscount = item.compareAtPrice && item.compareAtPrice > item.price;
  const originalTotal = hasDiscount ? item.compareAtPrice * item.quantity : null;
  
  return (
    <div className={styles.summaryItem}>
      <div className={styles.itemImageWrapper}>
        <div className={styles.itemImage}>
          <img src={item.image} alt={item.name} />
        </div>
        {item.quantity > 1 && (
          <span className={styles.quantityBadge}>{item.quantity}</span>
        )}
      </div>
      <div className={styles.itemDetails}>
        <h4 className={styles.itemName}>{item.name}</h4>
        {item.length && <span className={styles.itemVariant}>{item.length}"</span>}
      </div>
      <div className={styles.itemPricing}>
        <span className={styles.itemTotal}>{formatPrice(itemTotal)}</span>
        {hasDiscount && (
          <span className={styles.itemOriginalPrice}>{formatPrice(originalTotal)}</span>
        )}
        {item.quantity > 1 && (
          <span className={styles.priceBreakdown}>
            {formatPrice(hasDiscount ? item.compareAtPrice : item.price)} × {item.quantity}
          </span>
        )}
      </div>
    </div>
  );
};

