// ==========================================================================
// TrackOrderPage - Premium Order Tracking Experience
// ==========================================================================
// Supports: /track-order?orderNumber=HBT-2025-XXX
// Auto-fills email from My Orders session for seamless experience
// ==========================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Truck,
  Copy,
  Check,
  MapPin,
  CreditCard,
  Home,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Phone,
  ExternalLink,
  AlertCircle,
  Upload,
  Wallet,
} from 'lucide-react';

// Components
import {
  OrderSearchForm,
  OrderStatusHero,
  OrderTimeline,
  OrderItemsList,
} from '@components/orders';

import { trackEvent, EVENTS } from '@utils/analytics';
import styles from '@styles/module/TrackOrderPage.module.css';

// ==========================================================================
// Session Check (shared with MyOrdersPage)
// ==========================================================================
const SESSION_KEY = 'hbt_orders_session';
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

const getVerifiedEmail = () => {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return null;
    
    const { email, verifiedAt } = JSON.parse(session);
    const isExpired = Date.now() - verifiedAt > SESSION_DURATION;
    
    if (isExpired) return null;
    return email;
  } catch {
    return null;
  }
};

// ==========================================================================
// Payment Status Labels
// ==========================================================================
const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  verified: 'Verified',
  failed: 'Failed',
  rejected: 'Rejected',
  refunded: 'Refunded',
};

// ==========================================================================
// Animation Variants
// ==========================================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ==========================================================================
// Main Component
// ==========================================================================
const TrackOrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Form state
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');

  // UI state
  const [isSearching, setIsSearching] = useState(false);
  const [order, setOrder] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Track if we've attempted auto-search
  const hasAutoSearched = useRef(false);

  // ==========================================================================
  // Auto-fill from session and auto-search
  // ==========================================================================
  useEffect(() => {
    const urlOrderNumber = searchParams.get('orderNumber');
    if (urlOrderNumber) {
      setOrderNumber(urlOrderNumber);
    }

    // Check for verified session
    const verifiedEmail = getVerifiedEmail();
    if (verifiedEmail) {
      setHasSession(true);
      
      if (!hasAutoSearched.current) {
        setEmail(verifiedEmail);
        
        // If we have orderNumber from URL, auto-search
        if (urlOrderNumber) {
          hasAutoSearched.current = true;
          // Small delay to ensure state is set
          setTimeout(() => {
            performSearch(verifiedEmail, urlOrderNumber);
          }, 100);
        }
      }
    }
  }, [searchParams]);

  // ==========================================================================
  // Perform Search (extracted for reuse)
  // ==========================================================================
  const performSearch = async (searchEmail, searchOrderNumber) => {
    if (!searchEmail?.trim() || !searchOrderNumber?.trim()) return;

    setIsSearching(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: searchOrderNumber.trim(),
          email: searchEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Order not found');
      }

      setOrder(data.order);
      setExchangeRate(data.exchangeRate || 1);
      setSearchParams({ orderNumber: data.order.order_number });
      
      // Track order tracking event
      trackEvent(EVENTS.TRACK_ORDER, {
        order_number: data.order.order_number,
        status: data.order.status,
      });

    } catch (err) {
      console.error('Track order error:', err);
      setError(err.message || 'Unable to find order. Please check your details.');
    } finally {
      setIsSearching(false);
    }
  };

  // ==========================================================================
  // Handle Manual Search (from form)
  // ==========================================================================
  const handleSearch = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!orderNumber.trim()) {
      setError('Please enter your order number');
      return;
    }

    await performSearch(email, orderNumber);
  };

  // ==========================================================================
  // Clear Results
  // ==========================================================================
  const handleClear = () => {
    setOrder(null);
    setExchangeRate(1);
    setError('');
    setSearchParams({});
  };

  // ==========================================================================
  // Copy Tracking Number
  // ==========================================================================
  const copyTrackingNumber = useCallback(() => {
    if (order?.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [order]);

  // ==========================================================================
  // Check if payment is pending (needs action)
  // ==========================================================================
  const isPendingPayment = order && 
    order.payment_status === 'pending' && 
    order.payment_method === 'bank_transfer';

  const hasUploadedProof = order?.payment_proof_url;

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className={styles.page}>
      {/* Ambient Background */}
      <div className={styles.ambientBg}>
        <div className={styles.ambientOrb1} />
        <div className={styles.ambientOrb2} />
      </div>

      <div className={styles.container}>
        {/* Back to My Orders - Shows when user has verified session */}
        {hasSession && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link to="/orders" className={styles.backToOrders}>
              <ArrowLeft size={18} strokeWidth={2} />
              <span>Back to My Orders</span>
            </Link>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.iconBadge}>
            <Package size={24} strokeWidth={1.5} />
          </div>
          <h1 className={styles.title}>Track Your Order</h1>
          <p className={styles.subtitle}>
            Enter your email and order number to see real-time updates
          </p>
        </motion.div>

        {/* Search Form - Collapses after results */}
        <OrderSearchForm
          email={email}
          setEmail={setEmail}
          orderNumber={orderNumber}
          setOrderNumber={setOrderNumber}
          onSearch={handleSearch}
          isSearching={isSearching}
          error={error}
          hasResults={!!order}
          onClear={handleClear}
        />

        {/* Results */}
        <AnimatePresence mode="wait">
          {order && (
            <motion.div
              className={styles.results}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Status Hero Card */}
              <motion.div variants={itemVariants}>
                <OrderStatusHero
                  status={order.status}
                  paymentStatus={order.payment_status}
                  orderNumber={order.order_number}
                  createdAt={order.created_at}
                  paymentProofUrl={order.payment_proof_url}
                />
              </motion.div>

              {/* ============================================================
                  PAYMENT ACTION CARD - For pending bank transfer payments
                  ============================================================ */}
              {isPendingPayment && (
                <motion.div 
                  className={`${styles.paymentActionCard} ${hasUploadedProof ? styles.paymentActionCardUploaded : ''}`} 
                  variants={itemVariants}
                >
                  <div className={`${styles.paymentActionIcon} ${hasUploadedProof ? styles.paymentActionIconUploaded : ''}`}>
                    {hasUploadedProof ? (
                      <Upload size={24} />
                    ) : (
                      <AlertCircle size={24} />
                    )}
                  </div>
                  
                  <div className={styles.paymentActionContent}>
                    {hasUploadedProof ? (
                      <>
                        <h3 className={styles.paymentActionTitle}>
                          Payment Proof Uploaded
                        </h3>
                        <p className={styles.paymentActionText}>
                          We&apos;re reviewing your payment. This usually takes 1-2 business hours.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className={styles.paymentActionTitle}>
                          Complete Your Payment
                        </h3>
                        <p className={styles.paymentActionText}>
                          Your order is awaiting payment. Transfer to our bank account and upload your proof of payment.
                        </p>
                      </>
                    )}
                  </div>

                  {!hasUploadedProof && (
                    <Link 
                      to={`/checkout/payment?orderId=${order.id}`}
                      className={styles.paymentActionBtn}
                    >
                      <Wallet size={18} />
                      <span>Pay Now</span>
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </motion.div>
              )}

              {/* Shipping Info Card - Show if shipped with any delivery info */}
              {(order.carrier || order.tracking_number || order.courier_phone || order.tracking_url) && (
                <motion.div className={styles.trackingCard} variants={itemVariants}>
                  <div className={styles.trackingIcon}>
                    <Truck size={20} />
                  </div>
                  <div className={styles.trackingInfo}>
                    {order.carrier && (
                      <span className={styles.carrier}>{order.carrier}</span>
                    )}
                    {order.tracking_number && (
                      <>
                        <span className={styles.trackingLabel}>Tracking Number</span>
                        <span className={styles.trackingNumber}>{order.tracking_number}</span>
                      </>
                    )}
                  </div>
                  <div className={styles.trackingActions}>
                    {/* Copy tracking number if available */}
                    {order.tracking_number && (
                      <button className={styles.copyBtn} onClick={copyTrackingNumber}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                    
                    {/* Call Courier button if phone available */}
                    {order.courier_phone && (
                      <a 
                        href={`tel:${order.courier_phone}`} 
                        className={styles.actionBtn}
                      >
                        <Phone size={16} />
                        Call Courier
                      </a>
                    )}
                    
                    {/* Track Package button if URL available */}
                    {order.tracking_url && (
                      <a 
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionBtn}
                      >
                        <ExternalLink size={16} />
                        Track Package
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Timeline */}
              <motion.div variants={itemVariants}>
                <OrderTimeline order={order} />
              </motion.div>

              {/* Details Grid */}
              <motion.div className={styles.detailsGrid} variants={itemVariants}>
                {/* Order Items - Pass currency and exchangeRate! */}
                <OrderItemsList
                  items={order.items}
                  subtotal={order.subtotal}
                  discount={order.discount}
                  couponCode={order.coupon_code}
                  shippingCost={order.shipping_cost}
                  total={order.total}
                  currency={order.currency}
                  exchangeRate={exchangeRate}
                />

                {/* Shipping & Payment Column */}
                <div className={styles.infoColumn}>
                  {/* Shipping Address */}
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                      <MapPin size={18} />
                      Shipping Address
                    </h3>
                    <div className={styles.address}>
                      <p className={styles.addressName}>
                        {order.shipping_first_name} {order.shipping_last_name}
                      </p>
                      <p>{order.shipping_address}</p>
                      {order.shipping_apartment && <p>{order.shipping_apartment}</p>}
                      <p>
                        {order.shipping_city}
                        {order.shipping_state && `, ${order.shipping_state}`}
                        {order.shipping_postal_code && ` ${order.shipping_postal_code}`}
                      </p>
                      <p>{order.shipping_country}</p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                      <CreditCard size={18} />
                      Payment
                    </h3>
                    <div className={styles.paymentInfo}>
                      <div className={styles.paymentRow}>
                        <span>Method</span>
                        <span>
                          {order.payment_method === 'bank_transfer'
                            ? 'Bank Transfer'
                            : order.payment_method}
                        </span>
                      </div>
                      <div className={styles.paymentRow}>
                        <span>Status</span>
                        <span className={`${styles.paymentStatus} ${styles[order.payment_status]}`}>
                          {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Help Card */}
              <motion.div className={styles.helpCard} variants={itemVariants}>
                <div className={styles.helpIcon}>
                  <MessageCircle size={24} />
                </div>
                <div className={styles.helpContent}>
                  <h3>Need Help?</h3>
                  <p>Have questions about your order? Our support team is here to help.</p>
                </div>
                <Link to="/contact" className={styles.helpLink}>
                  Contact Support
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State - When no order searched yet */}
        {!order && !isSearching && (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.emptyIllustration}>
              <div className={styles.emptyOrb}>
                <Package size={40} strokeWidth={1} />
              </div>
              <Sparkles className={styles.sparkle1} size={16} />
              <Sparkles className={styles.sparkle2} size={12} />
              <Sparkles className={styles.sparkle3} size={14} />
            </div>
            <p className={styles.emptyText}>Enter your details above to track your order</p>
            <div className={styles.emptyHints}>
              <div className={styles.hint}>
                <CheckCircle2 size={14} />
                Real-time status updates
              </div>
              <div className={styles.hint}>
                <CheckCircle2 size={14} />
                Shipping tracking info
              </div>
              <div className={styles.hint}>
                <CheckCircle2 size={14} />
                Order history & details
              </div>
            </div>
          </motion.div>
        )}

        {/* Back Navigation */}
        <motion.div
          className={styles.backHome}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {hasSession && (
            <>
              <Link to="/orders" className={styles.backLinkPrimary}>
                <ArrowLeft size={16} />
                Back to My Orders
              </Link>
              <span className={styles.divider}>•</span>
            </>
          )}
          <Link to="/" className={styles.backLink}>
            <Home size={16} />
            Home
          </Link>
          <span className={styles.divider}>•</span>
          <Link to="/shop" className={styles.backLink}>
            <ShoppingBag size={16} />
            Shop
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default TrackOrderPage; 