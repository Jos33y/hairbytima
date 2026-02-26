// ==========================================================================
// MyOrdersPage - Premium Order History with Session Persistence
// ==========================================================================
// Features:
// - Session persistence (1-hour validity, no re-verification needed)
// - Real API integration (send-code, verify-code)
// - Per-order currency conversion
// - Premium animations & visuals
// ==========================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Mail,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Sparkles,
  Timer,
  XCircle,
  MapPin,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { trackEvent, EVENTS } from '@utils/analytics';
import styles from '@styles/module/MyOrdersPage.module.css'; 

// ==========================================================================
// Constants & Configuration
// ==========================================================================
const SESSION_KEY = 'hbt_orders_session';
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

const STATUS_CONFIG = {
  pending_payment: {
    label: 'Awaiting Payment',
    icon: Timer,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  awaiting_verification: {
    label: 'Verifying Payment',
    icon: Clock,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
  },
  processing: {
    label: 'Processing',
    icon: Clock,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
  },
  delivered: {
    label: 'Delivered',
    icon: PackageCheck,
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.12)',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
  },
};

// Determine display status based on order state
const getDisplayStatus = (order) => {
  // If payment was rejected
  if (order.payment_status === 'rejected' || order.payment_status === 'failed') {
    return 'pending_payment'; // Show as awaiting payment (needs re-upload)
  }
  
  // If payment proof uploaded but not yet verified
  if (
    order.payment_proof_url &&
    order.payment_status === 'pending' &&
    (order.status === 'pending_payment' || order.status === 'pending')
  ) {
    return 'awaiting_verification';
  }
  
  // Default to order status
  return order.status;
};

const CURRENCY_CONFIG = {
  USD: { symbol: '$', decimals: 2 },
  GBP: { symbol: '£', decimals: 2 },
  EUR: { symbol: '€', decimals: 2 },
  NGN: { symbol: '₦', decimals: 0 },
  GMD: { symbol: 'D', decimals: 2 },
};

// ==========================================================================
// Animation Variants
// ==========================================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
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

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ==========================================================================
// Helper Functions
// ==========================================================================
const formatCurrency = (amount, currency = 'USD', exchangeRate = 1) => {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const value = (parseFloat(amount) || 0) * exchangeRate;
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  return `${config.symbol}${formatted}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return formatDate(dateString);
};

// Session management
const getSession = () => {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return null;
    
    const { email, verifiedAt, orders, exchangeRates } = JSON.parse(session);
    const isExpired = Date.now() - verifiedAt > SESSION_DURATION;
    
    if (isExpired) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    return { email, verifiedAt, orders, exchangeRates };
  } catch {
    return null;
  }
};

const saveSession = (email, orders, exchangeRates) => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    email,
    verifiedAt: Date.now(),
    orders,
    exchangeRates,
  }));
};

const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

// ==========================================================================
// Main Component
// ==========================================================================
export default function MyOrdersPage() {
  // Step: 'loading' | 'email' | 'verify' | 'orders'
  const [step, setStep] = useState('loading');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const codeInputRefs = useRef([]);

  // ==========================================================================
  // Session Check on Mount
  // ==========================================================================
  useEffect(() => {
    const session = getSession();
    if (session) {
      setEmail(session.email);
      setOrders(session.orders);
      setExchangeRates(session.exchangeRates || { USD: 1 });
      setStep('orders');
      
      // Track view my orders from session
      trackEvent(EVENTS.VIEW_MY_ORDERS, {
        order_count: session.orders?.length || 0,
        from_session: true,
      });
    } else {
      setStep('email');
    }
  }, []);

  // ==========================================================================
  // Resend Timer
  // ==========================================================================
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'verify') {
      setCanResend(true);
    }
  }, [resendTimer, step]);

  // ==========================================================================
  // Send Verification Code
  // ==========================================================================
  const handleSendCode = async (e) => {
    e?.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/orders/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code');
      }

      setStep('verify');
      setResendTimer(60);
      setCanResend(false);
      setVerificationCode(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // Code Input Handlers
  // ==========================================================================
  const handleCodeChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newCode.every(d => d !== '')) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setVerificationCode(newCode);
      handleVerifyCode(pasted);
    }
  };

  // ==========================================================================
  // Verify Code
  // ==========================================================================
  const handleVerifyCode = async (code) => {
    setIsLoading(true);
    setError('');

    const fullCode = code || verificationCode.join('');

    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/orders/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      // Save session and show orders
      const ordersList = data.orders || [];
      const rates = data.exchangeRates || { USD: 1 };
      saveSession(email, ordersList, rates);
      setOrders(ordersList);
      setExchangeRates(rates);
      setStep('orders');
      
      // Track view my orders event
      trackEvent(EVENTS.VIEW_MY_ORDERS, {
        order_count: ordersList.length,
      });
    } catch (err) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // Resend Code
  // ==========================================================================
  const handleResendCode = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(60);
    setVerificationCode(['', '', '', '', '', '']);
    setError('');

    try {
      await fetch('/api/orders/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch (err) {
      console.error('Resend failed:', err);
    }
  };

  // ==========================================================================
  // Logout (Clear Session)
  // ==========================================================================
  const handleLogout = () => {
    clearSession();
    setStep('email');
    setEmail('');
    setOrders([]);
    setVerificationCode(['', '', '', '', '', '']);
    setError('');
  };

  // ==========================================================================
  // Refresh Orders (Re-fetch latest data)
  // ==========================================================================
  const handleRefresh = async () => {
    if (isRefreshing || !email) return;
    
    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/orders/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.orders) {
        const ordersList = data.orders;
        const rates = data.exchangeRates || { USD: 1 };
        saveSession(email, ordersList, rates);
        setOrders(ordersList);
        setExchangeRates(rates);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==========================================================================
  // Get Exchange Rate for Order
  // ==========================================================================
  const getOrderExchangeRate = (currency) => {
    if (!currency || currency === 'USD') return 1;
    return exchangeRates[currency] || 1;
  };

  // ==========================================================================
  // Render Loading State
  // ==========================================================================
  if (step === 'loading') {
    return (
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>
            <Loader2 size={32} className={styles.spin} />
          </div>
          <p>Loading your orders...</p>
        </div>
      </main>
    );
  }

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <main className={styles.page}>
      {/* Ambient Background */}
      <div className={styles.ambientBg}>
        <div className={styles.ambientOrb1} />
        <div className={styles.ambientOrb2} />
        <div className={styles.ambientOrb3} />
      </div>

      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.headerIcon}>
            <Package size={28} strokeWidth={1.5} />
          </div>
          <h1 className={styles.title}>My Orders</h1>
          <p className={styles.subtitle}>
            {step === 'email' && 'Enter your email to view your order history'}
            {step === 'verify' && 'Enter the verification code sent to your email'}
            {step === 'orders' && `Showing orders for ${email}`}
          </p>
        </motion.div>

        {/* Step: Email Input */}
        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.authCard}>
                <div className={styles.securityBadge}>
                  <ShieldCheck size={18} strokeWidth={1.5} />
                  <span>For your security, we'll send a verification code to your email</span>
                </div>

                <form onSubmit={handleSendCode} className={styles.authForm}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      <Mail size={14} />
                      Email Address
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Enter your email address"
                        className={styles.input}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        className={styles.errorMessage}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AlertCircle size={16} />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className={styles.spin} />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        Send Verification Code
                      </>
                    )}
                  </button>
                </form>

                {/* Track Order Link */}
                <div className={styles.altAction}>
                  <div className={styles.altIcon}>
                    <MapPin size={20} strokeWidth={1.5} />
                  </div>
                  <div className={styles.altContent}>
                    <h3>Track a Specific Order</h3>
                    <p>Have your order number? <Link to="/track-order">Track Order</Link></p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Verification Code */}
          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.authCard}>
                <button
                  className={styles.backBtn}
                  onClick={() => {
                    setStep('email');
                    setVerificationCode(['', '', '', '', '', '']);
                    setError('');
                  }}
                >
                  <ArrowLeft size={16} />
                  Change email
                </button>

                <div className={styles.verifyContent}>
                  <div className={styles.verifyIcon}>
                    <Mail size={32} strokeWidth={1.5} />
                    <div className={styles.verifyPulse} />
                  </div>

                  <h2 className={styles.verifyTitle}>Check your email</h2>
                  <p className={styles.verifyText}>
                    We sent a 6-digit code to <strong>{email}</strong>
                  </p>

                  <div className={styles.codeInputs} onPaste={handleCodePaste}>
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (codeInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        className={`${styles.codeInput} ${digit ? styles.filled : ''}`}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        className={styles.errorMessage}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AlertCircle size={16} />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    className={styles.primaryBtn}
                    onClick={() => handleVerifyCode()}
                    disabled={isLoading || verificationCode.some(d => d === '')}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className={styles.spin} />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Verify Code
                      </>
                    )}
                  </button>

                  <p className={styles.resendText}>
                    Didn't receive the code?{' '}
                    {canResend ? (
                      <button className={styles.resendBtn} onClick={handleResendCode}>
                        Resend code
                      </button>
                    ) : (
                      <span className={styles.resendTimer}>
                        Resend in {resendTimer}s
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Orders List */}
          {step === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {orders.length === 0 ? (
                // Empty State
                <motion.div
                  className={styles.emptyState}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className={styles.emptyIllustration}>
                    <div className={styles.emptyOrb}>
                      <ShoppingBag size={48} strokeWidth={1} />
                    </div>
                    <Sparkles className={styles.sparkle1} size={16} />
                    <Sparkles className={styles.sparkle2} size={12} />
                  </div>
                  <h2 className={styles.emptyTitle}>No Orders Yet</h2>
                  <p className={styles.emptyText}>
                    We couldn't find any orders associated with this email.
                  </p>
                  <Link to="/shop" className={styles.shopBtn}>
                    <ShoppingBag size={18} />
                    Start Shopping
                  </Link>
                </motion.div>
              ) : (
                // Orders List
                <>
                  <motion.div
                    className={styles.ordersHeader}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className={styles.ordersCount}>
                      <span className={styles.countNumber}>{orders.length}</span>
                      <span className={styles.countLabel}>
                        {orders.length === 1 ? 'Order' : 'Orders'}
                      </span>
                    </div>
                    <div className={styles.ordersActions}>
                      <button 
                        className={styles.refreshBtn} 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        title="Refresh orders"
                      >
                        <RefreshCw size={16} className={isRefreshing ? styles.spin : ''} />
                      </button>
                      <button className={styles.logoutBtn} onClick={handleLogout}>
                        Switch Account
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    className={styles.ordersList}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {orders.map((order, index) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        exchangeRate={getOrderExchangeRate(order.currency)}
                        isExpanded={expandedOrder === order.id}
                        onToggle={() => setExpandedOrder(
                          expandedOrder === order.id ? null : order.id
                        )}
                        index={index}
                      />
                    ))}
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

// ==========================================================================
// Order Card Component
// ==========================================================================
function OrderCard({ order, exchangeRate, isExpanded, onToggle, index }) {
  const displayStatus = getDisplayStatus(order);
  const status = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.processing;
  const StatusIcon = status.icon;
  const currency = order.currency || 'USD';
  const items = order.items || [];
  const displayItems = isExpanded ? items : items.slice(0, 2);
  const hasMoreItems = items.length > 2 && !isExpanded;

  return (
    <motion.div
      className={styles.orderCard}
      variants={itemVariants}
      layout
    >
      {/* Order Header */}
      <div className={styles.orderHeader}>
        <div className={styles.orderMeta}>
          <span className={styles.orderNumber}>{order.order_number}</span>
          <span className={styles.orderDate}>{formatRelativeDate(order.created_at)}</span>
        </div>
        <div
          className={styles.statusBadge}
          style={{
            '--status-color': status.color,
            '--status-bg': status.bg,
          }}
        >
          <StatusIcon size={14} strokeWidth={2} />
          {status.label}
        </div>
      </div>

      {/* Order Items */}
      <div className={styles.orderItems}>
        <AnimatePresence>
          {displayItems.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              className={styles.orderItem}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {item.product_image ? (
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className={styles.itemImage}
                />
              ) : (
                <div className={styles.itemPlaceholder}>
                  <Package size={18} />
                </div>
              )}
              <div className={styles.itemDetails}>
                <span className={styles.itemName}>{item.product_name}</span>
                <span className={styles.itemMeta}>
                  {item.length && `${item.length} • `}Qty: {item.quantity}
                </span>
              </div>
              <span className={styles.itemPrice}>
                {formatCurrency(item.total_price, currency, exchangeRate)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {hasMoreItems && (
          <button className={styles.showMoreBtn} onClick={onToggle}>
            <Eye size={14} />
            Show {items.length - 2} more item{items.length - 2 > 1 ? 's' : ''}
          </button>
        )}

        {isExpanded && items.length > 2 && (
          <button className={styles.showLessBtn} onClick={onToggle}>
            Show less
          </button>
        )}
      </div>

      {/* Order Footer */}
      <div className={styles.orderFooter}>
        <div className={styles.orderTotal}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>
            {formatCurrency(order.total, currency, exchangeRate)}
          </span>
        </div>
        <Link
          to={`/track-order?orderNumber=${order.order_number}`}
          className={styles.trackBtn}
        >
          View Details
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Progress Indicator */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: displayStatus === 'delivered' ? '100%' :
                   displayStatus === 'shipped' ? '75%' :
                   displayStatus === 'processing' ? '50%' :
                   displayStatus === 'awaiting_verification' ? '35%' :
                   '25%',
            background: status.color,
          }}
        />
      </div>
    </motion.div>
  );
}