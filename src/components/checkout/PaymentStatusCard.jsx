// ==========================================================================
// PaymentStatusCard - Displays payment status for all states
// ==========================================================================
// States: pending_verification, confirmed, rejected
// ==========================================================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Mail,
  Phone,
} from 'lucide-react';
import styles from '@styles/module/PaymentStatusCard.module.css'; 

// ==========================================================================
// Status Configurations
// ==========================================================================
const STATUS_CONFIG = {
  pending_verification: {
    icon: Clock,
    iconBg: 'warning',
    title: 'Payment Proof Uploaded',
    subtitle: 'We\'re reviewing your payment',
    description: 'Our team is verifying your payment proof. This usually takes 1-2 hours during business hours.',
    badge: 'Awaiting Verification',
    badgeType: 'warning',
    showTrackButton: true,
    showReupload: false,
  },
  confirmed: {
    icon: CheckCircle2,
    iconBg: 'success',
    title: 'Payment Confirmed!',
    subtitle: 'Your order is being prepared',
    description: 'Great news! Your payment has been verified and your order is now being processed. You\'ll receive shipping updates via email.',
    badge: 'Payment Verified',
    badgeType: 'success',
    showTrackButton: true,
    showReupload: false,
  },
  rejected: {
    icon: XCircle,
    iconBg: 'error',
    title: 'Payment Proof Rejected',
    subtitle: 'Please upload a new proof',
    description: null, // Will use rejection reason
    badge: 'Action Required',
    badgeType: 'error',
    showTrackButton: false,
    showReupload: true,
  },
  expired: {
    icon: AlertTriangle,
    iconBg: 'warning',
    title: 'Payment Window Expired',
    subtitle: 'Order cancelled due to timeout',
    description: 'Your order was cancelled because payment wasn\'t received within 24 hours. Please place a new order if you\'d still like to purchase.',
    badge: 'Order Expired',
    badgeType: 'error',
    showTrackButton: false,
    showReupload: false,
    showNewOrder: true,
  },
};

// Common rejection reasons
const REJECTION_REASONS = {
  unclear: 'The uploaded image was unclear or unreadable. Please upload a clearer screenshot.',
  wrong_amount: 'The transfer amount doesn\'t match the order total. Please verify and upload the correct proof.',
  wrong_account: 'The transfer was sent to a different account. Please transfer to the correct account.',
  incomplete: 'The payment proof is incomplete. Please upload a full screenshot showing transaction details.',
  default: 'There was an issue with your payment proof. Please upload a new one.',
};

// ==========================================================================
// Main Component
// ==========================================================================
const PaymentStatusCard = ({ 
  status, 
  orderNumber, 
  rejectionReason = null,
  onReupload = null,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending_verification;
  const IconComponent = config.icon;
  
  // Get rejection message
  const rejectionMessage = rejectionReason 
    ? REJECTION_REASONS[rejectionReason] || rejectionReason
    : REJECTION_REASONS.default;

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Icon */}
      <motion.div 
        className={`${styles.iconWrapper} ${styles[config.iconBg]}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
      >
        <IconComponent size={36} strokeWidth={1.5} />
      </motion.div>

      {/* Title & Subtitle */}
      <motion.h3 
        className={styles.title}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {config.title}
      </motion.h3>
      
      <motion.p 
        className={styles.subtitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        {config.subtitle}
      </motion.p>

      {/* Description */}
      <motion.p 
        className={styles.description}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {status === 'rejected' ? rejectionMessage : config.description}
      </motion.p>

      {/* Status Badge */}
      <motion.div 
        className={`${styles.badge} ${styles[config.badgeType]}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
      >
        <IconComponent size={14} strokeWidth={2} />
        {config.badge}
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className={styles.actions}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {config.showTrackButton && (
          <Link 
            to={`/track-order?orderNumber=${orderNumber}`}
            className={styles.primaryButton}
          >
            Track Order Status
            <ArrowRight size={16} />
          </Link>
        )}

        {config.showReupload && onReupload && (
          <button 
            className={styles.primaryButton}
            onClick={onReupload}
          >
            <RefreshCw size={16} />
            Upload New Proof
          </button>
        )}

        {config.showNewOrder && (
          <Link 
            to="/shop"
            className={styles.primaryButton}
          >
            Continue Shopping
            <ArrowRight size={16} />
          </Link>
        )}
      </motion.div>

      {/* Support Section */}
      <motion.div 
        className={styles.support}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <p>Need help?</p>
        <div className={styles.supportLinks}>
          <a href="mailto:support@hairbytimablaq.com">
            <Mail size={14} strokeWidth={1.5} />
            Email
          </a>
          <a href="https://wa.me/2207431514" target="_blank" rel="noopener noreferrer">
            <Phone size={14} strokeWidth={1.5} />
            WhatsApp
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PaymentStatusCard;