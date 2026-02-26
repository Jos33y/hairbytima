// ==========================================================================
// OrderItemsList - Order Items with Totals & Proper Currency
// ==========================================================================

import { motion } from 'framer-motion';
import { ShoppingBag, Package } from 'lucide-react';
import styles from '@styles/module/orders/OrderItemsList.module.css';

// ==========================================================================
// Currency Configuration
// ==========================================================================
const CURRENCY_CONFIG = {
  USD: { symbol: '$', locale: 'en-US', decimals: 2 },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 2 },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 2 },
  NGN: { symbol: '₦', locale: 'en-NG', decimals: 0 },
  GMD: { symbol: 'D', locale: 'en-GM', decimals: 0 },
};

// ==========================================================================
// Format Currency Helper (with conversion)
// ==========================================================================
const formatCurrency = (amount, currency = 'USD', exchangeRate = 1) => {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const value = (parseFloat(amount) || 0) * exchangeRate;
  
  const formatted = value.toLocaleString(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  
  return `${config.symbol}${formatted}`;
};

// ==========================================================================
// Item Row Component
// ==========================================================================
const ItemRow = ({ item, currency, exchangeRate }) => {
  return (
    <div className={styles.item}>
      {item.product_image ? (
        <img
          src={item.product_image}
          alt={item.product_name}
          className={styles.itemImage}
        />
      ) : (
        <div className={styles.itemPlaceholder}>
          <Package size={20} />
        </div>
      )}
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{item.product_name}</span>
        <span className={styles.itemMeta}>
          {item.length && `${item.length} • `}
          Qty: {item.quantity}
        </span>
      </div>
      <span className={styles.itemPrice}>
        {formatCurrency(item.total_price, currency, exchangeRate)}
      </span>
    </div>
  );
};

// ==========================================================================
// Main Component
// ==========================================================================
const OrderItemsList = ({ 
  items = [], 
  subtotal, 
  discount = 0, 
  couponCode,
  shippingCost = 0, 
  total, 
  currency = 'USD',
  exchangeRate = 1,
}) => {
  const hasDiscount = parseFloat(discount) > 0;
  const hasShipping = parseFloat(shippingCost) > 0;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <ShoppingBag size={18} />
        Order Items
        <span className={styles.itemCount}>{items.length}</span>
      </h3>

      {/* Items List */}
      <div className={styles.items}>
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ItemRow item={item} currency={currency} exchangeRate={exchangeRate} />
          </motion.div>
        ))}
      </div>

      {/* Order Totals */}
      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, currency, exchangeRate)}</span>
        </div>

        {hasDiscount && (
          <div className={`${styles.totalRow} ${styles.discount}`}>
            <span>
              Discount
              {couponCode && <span className={styles.couponBadge}>{couponCode}</span>}
            </span>
            <span>-{formatCurrency(discount, currency, exchangeRate)}</span>
          </div>
        )}

        <div className={styles.totalRow}>
          <span>Shipping</span>
          <span>
            {hasShipping ? formatCurrency(shippingCost, currency, exchangeRate) : 'Free'}
          </span>
        </div>

        <div className={styles.grandTotal}>
          <span>Total</span>
          <span className={styles.grandTotalAmount}>
            {formatCurrency(total, currency, exchangeRate)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsList;