// ==========================================================================
// BankTransferPage - Premium Payment Instructions & Proof Upload
// ==========================================================================
// Handles all payment states: upload, pending verification, confirmed, rejected
// ==========================================================================

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Copy,
  Check,
  Upload,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Shield,
  Sparkles,
  CreditCard,
  Timer,
  Heart
} from 'lucide-react';
import { formatPriceInCurrency, getConvertedAmount, CURRENCY_CONFIG } from '@utils/currencyFormat';
import { trackPurchase, trackUploadPaymentProof } from '@utils/analytics';
import PaymentStatusCard from '@components/checkout/PaymentStatusCard';
import PaymentProofUpload from '@components/checkout/PaymentProofUpload';
import styles from '@styles/module/BankTransferPage.module.css'; 

// ==========================================================================
// Copy Button Component
// ==========================================================================
const CopyButton = ({ text, label, showLabel = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(String(text));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <motion.button
      className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
      onClick={handleCopy}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      title={`Copy ${label}`}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            className={styles.copyIcon}
          >
            <Check size={14} strokeWidth={2.5} />
            {showLabel && <span>Copied!</span>}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={styles.copyIcon}
          >
            <Copy size={14} strokeWidth={1.5} />
            {showLabel && <span>Copy</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ==========================================================================
// Countdown Timer Component
// ==========================================================================
const CountdownTimer = ({ orderCreatedAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!orderCreatedAt) return 0;
      
      const orderTime = new Date(orderCreatedAt).getTime();
      const expiryTime = orderTime + (24 * 60 * 60 * 1000); // +24 hours
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      
      return remaining;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0 && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [orderCreatedAt, onExpire]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  if (timeLeft <= 0) {
    return (
      <div className={styles.countdownExpired}>
        <AlertCircle size={16} strokeWidth={1.5} />
        <span>Payment window expired</span>
      </div>
    );
  }

  return (
    <div className={styles.countdown}>
      <Timer size={16} strokeWidth={1.5} />
      <span>Complete payment within:</span>
      <div className={styles.countdownTime}>
        <span>{String(hours).padStart(2, '0')}</span>:
        <span>{String(minutes).padStart(2, '0')}</span>:
        <span>{String(seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

// ==========================================================================
// Step Indicator
// ==========================================================================
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Order Placed', icon: CheckCircle2 },
    { num: 2, label: 'Make Payment', icon: CreditCard },
    { num: 3, label: 'Verification', icon: Shield },
  ];

  return (
    <div className={styles.steps}>
      {steps.map((step, idx) => (
        <div 
          key={step.num}
          className={`${styles.step} ${currentStep >= step.num ? styles.stepActive : ''} ${currentStep === step.num ? styles.stepCurrent : ''}`}
        >
          <div className={styles.stepIcon}>
            {currentStep > step.num ? (
              <Check size={16} strokeWidth={2.5} />
            ) : (
              <step.icon size={16} strokeWidth={1.5} />
            )}
          </div>
          <span className={styles.stepLabel}>{step.label}</span>
          {idx < steps.length - 1 && <div className={styles.stepLine} />}
        </div>
      ))}
    </div>
  );
};

// ==========================================================================
// Determine Payment View State
// ==========================================================================
const getPaymentViewState = (order) => {
  if (!order) return 'loading';
  
  const { payment_status, payment_proof_url } = order;
  
  // Payment confirmed/paid
  if (payment_status === 'confirmed' || payment_status === 'paid') {
    return 'confirmed';
  }
  
  // Payment rejected - allow re-upload
  if (payment_status === 'rejected' || payment_status === 'failed') {
    return 'rejected';
  }
  
  // Proof uploaded, awaiting verification
  if (payment_proof_url && payment_status === 'pending') {
    return 'pending_verification';
  }
  
  // No proof uploaded yet - show upload form
  return 'upload';
};

// ==========================================================================
// Main Component
// ==========================================================================
const BankTransferPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get order data from navigation state OR fetch via query params
  const stateOrder = location.state?.order;
  const stateBankAccount = location.state?.bankAccount;
  const stateCustomerEmail = location.state?.customerEmail;
  const stateExchangeRate = location.state?.exchangeRate;

  // State
  const [order, setOrder] = useState(stateOrder || null);
  const [bankAccount, setBankAccount] = useState(stateBankAccount || null);
  const [customerEmail, setCustomerEmail] = useState(stateCustomerEmail || '');
  const [exchangeRate, setExchangeRate] = useState(stateExchangeRate || 1);
  const [loading, setLoading] = useState(!stateOrder);
  const [fetchError, setFetchError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Full order data (includes payment_proof_url, payment_status)
  const [fullOrder, setFullOrder] = useState(null);
  
  // View state: 'upload' | 'pending_verification' | 'confirmed' | 'rejected' | 'expired'
  const [viewState, setViewState] = useState('upload');
  
  // Track if we've already tracked this purchase (prevent duplicates)
  const hasTrackedPurchase = useRef(false);
  
  // Current step for indicator
  const currentStep = viewState === 'upload' ? 2 : 3;

  // Track purchase when landing from checkout (only once)
  useEffect(() => {
    if (stateOrder && !hasTrackedPurchase.current) {
      // This is a fresh checkout - track the purchase
      trackPurchase({
        id: stateOrder.id,
        orderNumber: stateOrder.orderNumber,
        total: stateOrder.total,
        currency: stateOrder.currency,
      });
      hasTrackedPurchase.current = true;
    }
  }, [stateOrder]);

  // Helper to format price in order's currency
  const formatOrderPrice = (amountInUSD) => {
    if (!order) return '$0';
    return formatPriceInCurrency(amountInUSD, order.currency, exchangeRate);
  };

  // ==========================================================================
  // Fetch Order
  // ==========================================================================
  useEffect(() => {
    if (stateOrder) {
      // If we have state, still fetch to get full order details
      const params = new URLSearchParams(location.search);
      const orderId = params.get('orderId') || stateOrder.id;
      
      if (orderId) {
        fetchOrderDetails(orderId);
      } else {
        setLoading(false);
        setViewState('upload');
      }
      return;
    }

    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');

    if (!orderId) {
      navigate('/cart');
      return;
    }

    fetchOrderDetails(orderId);
  }, [stateOrder, location.search, navigate]);

  const fetchOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`/api/orders?id=${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      
      const data = await res.json();
      
      // Set display order
      setOrder({
        id: data.order.id,
        orderNumber: data.order.order_number,
        total: data.order.total,
        currency: data.order.currency,
        createdAt: data.order.created_at,
      });
      
      // Set full order for status checking
      setFullOrder(data.order);
      
      setBankAccount(data.bankAccount);
      setCustomerEmail(data.order.customer_email);
      setExchangeRate(data.exchangeRate || 1);
      
      // Determine view state based on payment status
      const state = getPaymentViewState(data.order);
      setViewState(state);
      
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setFetchError('Unable to load order. Check your confirmation email for payment link.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // Handlers
  // ==========================================================================
  const handleUploadSuccess = (data) => {
    setUploadSuccess(true);
    
    // Track payment proof upload
    trackUploadPaymentProof(order.orderNumber);
    
    // After 2 seconds, redirect to tracking page
    setTimeout(() => {
      navigate(`/track-order?orderNumber=${order.orderNumber}`);
    }, 2500);
  };

  const handleReupload = () => {
    // Reset to upload state
    setViewState('upload');
    setFullOrder(prev => ({ ...prev, payment_proof_url: null }));
  };

  const handleExpire = () => {
    setViewState('expired');
  };

  // ==========================================================================
  // Loading State
  // ==========================================================================
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Error State
  // ==========================================================================
  if (fetchError) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <AlertCircle size={48} strokeWidth={1} />
          <h2>Order Not Found</h2>
          <p>{fetchError}</p>
          <Link to="/shop" className={styles.errorLink}>
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Success Overlay */}
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div
              className={styles.successOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={styles.successContent}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <motion.div
                  className={styles.successIcon}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                >
                  <CheckCircle2 size={64} strokeWidth={1.5} />
                </motion.div>
                <h2>Payment Proof Uploaded!</h2>
                <p>We'll verify your payment and process your order soon.</p>
                <p className={styles.redirectText}>Redirecting to order tracking...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className={styles.orderBadge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Sparkles size={16} strokeWidth={1.5} />
            {viewState === 'confirmed' ? 'Payment Confirmed' : 'Order Confirmed'}
          </motion.div>
          <h1 className={styles.title}>
            {viewState === 'confirmed' ? 'Thank You!' : 
             viewState === 'pending_verification' ? 'Payment Under Review' :
             viewState === 'rejected' ? 'Action Required' :
             'Complete Your Payment'}
          </h1>
          <p className={styles.subtitle}>
            {viewState === 'confirmed' ? 'Your order is being prepared' :
             viewState === 'pending_verification' ? 'We\'re verifying your payment' :
             viewState === 'rejected' ? 'Please upload a new payment proof' :
             'Just one step away from your beautiful hair'}
          </p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StepIndicator currentStep={currentStep} />
        </motion.div>

        {/* Order Summary Card */}
        <motion.div 
          className={styles.orderCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className={styles.orderCardLeft}>
            <span className={styles.orderCardLabel}>Order Number</span>
            <div className={styles.orderCardValue}>
              <span>{order.orderNumber}</span>
              <CopyButton text={order.orderNumber} label="order number" />
            </div>
          </div>
          <div className={styles.orderCardDivider} />
          <div className={styles.orderCardRight}>
            <span className={styles.orderCardLabel}>Amount Due</span>
            <div className={styles.orderCardAmount}>
              <span>{formatOrderPrice(order.total)}</span>
            </div>
          </div>
        </motion.div>

        {/* Countdown Timer - Only show for upload state */}
        {viewState === 'upload' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CountdownTimer 
              orderCreatedAt={order.createdAt} 
              onExpire={handleExpire}
            />
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className={styles.content}>
          {/* Bank Details - Only show for upload and rejected states */}
          {(viewState === 'upload' || viewState === 'rejected') && (
            <motion.div
              className={styles.bankSection}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <Building2 size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2>Bank Transfer Details</h2>
                  <p>Send payment to this account</p>
                </div>
              </div>

              {bankAccount ? (
                <div className={styles.bankDetails}>
                  <div className={styles.bankCard}>
                    <div className={styles.bankRow}>
                      <span className={styles.bankLabel}>Bank</span>
                      <div className={styles.bankValue}>
                        <span className={styles.bankName}>{bankAccount.bankName}</span>
                        <CopyButton text={bankAccount.bankName} label="bank name" />
                      </div>
                    </div>

                    <div className={styles.bankRow}>
                      <span className={styles.bankLabel}>Account Name</span>
                      <div className={styles.bankValue}>
                        <span>{bankAccount.accountName}</span>
                        <CopyButton text={bankAccount.accountName} label="account name" />
                      </div>
                    </div>

                    <div className={styles.bankRowHighlight}>
                      <span className={styles.bankLabel}>Account Number</span>
                      <div className={styles.bankValue}>
                        <span className={styles.accountNumber}>{bankAccount.accountNumber}</span>
                        <CopyButton text={bankAccount.accountNumber} label="account number" showLabel />
                      </div>
                    </div>

                    {bankAccount.sortCode && (
                      <div className={styles.bankRow}>
                        <span className={styles.bankLabel}>Sort Code</span>
                        <div className={styles.bankValue}>
                          <span>{bankAccount.sortCode}</span>
                          <CopyButton text={bankAccount.sortCode} label="sort code" />
                        </div>
                      </div>
                    )}

                    {bankAccount.routingNumber && (
                      <div className={styles.bankRow}>
                        <span className={styles.bankLabel}>Routing Number</span>
                        <div className={styles.bankValue}>
                          <span>{bankAccount.routingNumber}</span>
                          <CopyButton text={bankAccount.routingNumber} label="routing number" />
                        </div>
                      </div>
                    )}

                    {bankAccount.swiftCode && (
                      <div className={styles.bankRow}>
                        <span className={styles.bankLabel}>SWIFT/BIC</span>
                        <div className={styles.bankValue}>
                          <span>{bankAccount.swiftCode}</span>
                          <CopyButton text={bankAccount.swiftCode} label="swift code" />
                        </div>
                      </div>
                    )}

                    {bankAccount.iban && (
                      <div className={styles.bankRow}>
                        <span className={styles.bankLabel}>IBAN</span>
                        <div className={styles.bankValue}>
                          <span className={styles.iban}>{bankAccount.iban}</span>
                          <CopyButton text={bankAccount.iban} label="IBAN" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Amount to Transfer */}
                  <div className={styles.amountCard}>
                    <span className={styles.amountLabel}>Amount to Transfer</span>
                    <div className={styles.amountValue}>
                      {formatOrderPrice(order.total)}
                    </div>
                    <div className={styles.amountCopy}>
                      <span className={styles.amountRaw}>
                        {getConvertedAmount(order.total, order.currency, exchangeRate)}
                      </span>
                      <CopyButton 
                        text={getConvertedAmount(order.total, order.currency, exchangeRate)} 
                        label="amount" 
                        showLabel 
                      />
                    </div>
                    <p className={styles.amountNote}>
                      Please transfer the exact amount for faster verification
                    </p>
                  </div>

                  {/* Reference */}
                  <div className={styles.referenceCard}>
                    <span className={styles.referenceLabel}>Payment Reference</span>
                    <div className={styles.referenceValue}>
                      <span>{order.orderNumber}</span>
                      <CopyButton text={order.orderNumber} label="reference" showLabel />
                    </div>
                    <p className={styles.referenceNote}>
                      Include this reference in your transfer description
                    </p>
                  </div>
                </div>
              ) : (
                <div className={styles.noBankAccount}>
                  <AlertCircle size={24} strokeWidth={1.5} />
                  <p>Bank details not available for this currency.</p>
                  <p>Please contact support for payment instructions.</p>
                </div>
              )}

              {/* Trust Badges */}
              <div className={styles.trustBadges}>
                <div className={styles.trustItem}>
                  <Shield size={16} strokeWidth={1.5} />
                  <span>Secure</span>
                </div>
                <div className={styles.trustItem}>
                  <Clock size={16} strokeWidth={1.5} />
                  <span>24hr to Pay</span>
                </div>
                <div className={styles.trustItem}>
                  <Heart size={16} strokeWidth={1.5} />
                  <span>Premium</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Upload Section / Status Card */}
          <motion.div
            className={styles.uploadSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {viewState === 'upload' && (
              <PaymentProofUpload
                orderId={order.id}
                orderNumber={order.orderNumber}
                onUploadSuccess={handleUploadSuccess}
              />
            )}

            {(viewState === 'pending_verification' || viewState === 'confirmed' || viewState === 'rejected' || viewState === 'expired') && (
              <PaymentStatusCard
                status={viewState}
                orderNumber={order.orderNumber}
                rejectionReason={fullOrder?.rejection_reason}
                onReupload={viewState === 'rejected' ? handleReupload : null}
              />
            )}
          </motion.div>
        </div>

        {/* Bottom CTA - Only show for upload state */}
        {viewState === 'upload' && (
          <motion.div 
            className={styles.bottomCta}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p>Check your email for order details and payment link</p>
            <Link to={`/track-order?orderNumber=${order.orderNumber}`} className={styles.trackLink}>
              Track Order Status <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BankTransferPage;