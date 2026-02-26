// ==========================================================================
// OrderStatusHero - Large Status Display Card
// ==========================================================================

import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  PackageCheck,
  Timer,
  XCircle,
  Clock,
  Hash,
  Calendar,
  FileCheck,
} from 'lucide-react';
import styles from '@styles/module/orders/OrderStatusHero.module.css';

// ==========================================================================
// Status Configuration
// ==========================================================================
const STATUS_CONFIG = {
  pending_payment: {
    label: 'Awaiting Payment',
    description: 'Complete your payment to process your order',
    icon: Timer,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  processing: {
    label: 'Processing',
    description: 'Your order is being prepared with care',
    icon: Package,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  shipped: {
    label: 'Shipped',
    description: 'Your order is on its way to you',
    icon: Truck,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  delivered: {
    label: 'Delivered',
    description: 'Your order has been delivered',
    icon: PackageCheck,
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This order has been cancelled',
    icon: XCircle,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
};

// Payment status overrides
const PAYMENT_OVERRIDE = {
  rejected: {
    label: 'Payment Rejected',
    description: 'Your payment proof was rejected. Please re-upload.',
    icon: XCircle,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  failed: {
    label: 'Payment Failed',
    description: 'Your payment could not be processed',
    icon: XCircle,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  awaiting_verification: {
    label: 'Awaiting Verification',
    description: 'Your payment proof has been submitted and is being reviewed',
    icon: FileCheck,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  pending: {
    label: 'Awaiting Payment',
    description: 'Please complete your payment to process your order',
    icon: Clock,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
};

// ==========================================================================
// Helper: Format Date
// ==========================================================================
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ==========================================================================
// Main Component
// ==========================================================================
const OrderStatusHero = ({ 
  status, 
  paymentStatus,
  orderNumber, 
  createdAt,
  paymentProofUrl,
}) => {
  // Determine which config to use
  let config;
  
  if (paymentStatus === 'rejected' || paymentStatus === 'failed') {
    // Payment was rejected
    config = PAYMENT_OVERRIDE[paymentStatus];
  } else if (paymentStatus === 'pending' && paymentProofUrl) {
    // Payment proof uploaded, awaiting admin verification
    config = PAYMENT_OVERRIDE.awaiting_verification;
  } else if (status === 'pending_payment' && paymentStatus === 'pending') {
    // No payment proof yet
    config = PAYMENT_OVERRIDE.pending;
  } else {
    // Use order status
    config = STATUS_CONFIG[status] || STATUS_CONFIG.processing;
  }

  const StatusIcon = config.icon;

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div 
        className={styles.iconWrapper}
        style={{ 
          backgroundColor: config.bgColor,
          color: config.color,
        }}
      >
        <StatusIcon size={36} strokeWidth={1.5} />
        <div 
          className={styles.pulse}
          style={{ borderColor: config.color }}
        />
      </div>

      <div className={styles.content}>
        <span 
          className={styles.badge}
          style={{ 
            backgroundColor: config.bgColor,
            color: config.color,
          }}
        >
          {config.label}
        </span>
        <h2 className={styles.description}>{config.description}</h2>
        <div className={styles.meta}>
          <span className={styles.orderNumber}>
            <Hash size={14} />
            {orderNumber}
          </span>
          <span className={styles.date}>
            <Calendar size={14} />
            {formatDate(createdAt)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderStatusHero;