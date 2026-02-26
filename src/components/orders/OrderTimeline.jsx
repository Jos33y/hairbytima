// ==========================================================================
// OrderTimeline - Visual Order Progress with Rejection Handling
// ==========================================================================

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  CircleDot,
  Clock,
  XCircle,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import styles from '@styles/module/orders/OrderTimeline.module.css';

// ==========================================================================
// Timeline Step Component
// ==========================================================================
const TimelineStep = ({ 
  status, 
  date, 
  completed, 
  rejected, 
  current,
  reviewing,
  isLast,
  trackingNumber,
  carrier,
}) => {
  const getIcon = () => {
    if (rejected) return <XCircle size={14} />;
    if (completed) return <CheckCircle2 size={14} />;
    if (reviewing) return <Clock size={14} />;
    if (current) return <Clock size={14} />;
    return null;
  };

  const getStepClass = () => {
    if (rejected) return styles.rejected;
    if (completed) return styles.completed;
    if (reviewing) return styles.reviewing;
    if (current) return styles.current;
    return styles.pending;
  };

  return (
    <div className={`${styles.step} ${getStepClass()}`}>
      <div className={styles.dot}>
        {getIcon()}
      </div>
      {!isLast && (
        <div className={`${styles.line} ${completed && !rejected ? styles.lineCompleted : ''}`} />
      )}
      <div className={styles.content}>
        <span className={styles.status}>{status}</span>
        <span className={styles.date}>{date}</span>
        {trackingNumber && (
          <span className={styles.tracking}>
            {carrier && `${carrier}: `}{trackingNumber}
          </span>
        )}
      </div>
    </div>
  );
};

// ==========================================================================
// Main OrderTimeline Component
// ==========================================================================
const OrderTimeline = ({ 
  order,
  onReupload,
}) => {
  const { 
    status, 
    payment_status, 
    payment_proof_url,
    created_at,
    shipped_at,
    delivered_at,
    tracking_number,
    carrier,
    timeline: apiTimeline,
    rejection_reason,
    order_number,
  } = order;

  // Determine payment state
  const isPaymentConfirmed = payment_status === 'paid' || payment_status === 'verified';
  const isPaymentRejected = payment_status === 'failed' || payment_status === 'rejected';
  const isPaymentPending = payment_status === 'pending';
  const hasProofUploaded = !!payment_proof_url;

  // Build timeline steps
  const buildTimeline = () => {
    const steps = [];

    // Step 1: Order Placed - Always completed
    steps.push({
      status: 'Order Placed',
      date: formatDate(created_at),
      completed: true,
      rejected: false,
      current: false,
    });

    // Step 2: Payment - Can be confirmed, rejected, pending, or awaiting verification
    if (isPaymentRejected) {
      steps.push({
        status: 'Payment Rejected',
        date: rejection_reason || 'Please re-upload payment proof',
        completed: false,
        rejected: true,
        current: false,
      });
    } else if (isPaymentConfirmed) {
      steps.push({
        status: 'Payment Confirmed',
        date: getTimelineEventDate(apiTimeline, ['payment_confirmed', 'Payment confirmed', 'payment_verified']) || 'Verified',
        completed: true,
        rejected: false,
        current: false,
      });
    } else if (isPaymentPending && hasProofUploaded) {
      // Proof uploaded, awaiting admin verification
      steps.push({
        status: 'Awaiting Verification',
        date: 'Your payment proof is being reviewed',
        completed: false,
        rejected: false,
        current: false,
        reviewing: true,
      });
    } else {
      steps.push({
        status: 'Payment Pending',
        date: 'Please complete your payment',
        completed: false,
        rejected: false,
        current: isPaymentPending,
      });
    }

    // Only show remaining steps if payment is not rejected
    if (!isPaymentRejected) {
      // Step 3: Processing
      const isProcessing = ['processing', 'shipped', 'delivered'].includes(status);
      steps.push({
        status: 'Processing',
        date: isProcessing 
          ? getTimelineEventDate(apiTimeline, ['processing_started', 'Processing started']) || 'In Progress'
          : 'Pending',
        completed: isProcessing,
        rejected: false,
        current: status === 'processing',
      });

      // Step 4: Shipped
      const isShipped = ['shipped', 'delivered'].includes(status);
      steps.push({
        status: 'Shipped',
        date: shipped_at ? formatDate(shipped_at) : 'Pending',
        completed: isShipped,
        rejected: false,
        current: status === 'shipped',
        trackingNumber: tracking_number,
        carrier: carrier,
      });

      // Step 5: Delivered
      steps.push({
        status: 'Delivered',
        date: delivered_at ? formatDate(delivered_at) : 'Pending',
        completed: status === 'delivered',
        rejected: false,
        current: false,
      });
    }

    return steps;
  };

  const timelineSteps = buildTimeline();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <CircleDot size={18} />
        Order Timeline
      </h3>

      <div className={styles.timeline}>
        {timelineSteps.map((step, index) => (
          <TimelineStep
            key={index}
            {...step}
            isLast={index === timelineSteps.length - 1}
          />
        ))}
      </div>

      {/* Rejection Action - Re-upload payment proof */}
      {isPaymentRejected && (
        <motion.div 
          className={styles.rejectionAction}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.rejectionIcon}>
            <AlertTriangle size={20} />
          </div>
          <div className={styles.rejectionContent}>
            <p className={styles.rejectionTitle}>Payment Verification Failed</p>
            <p className={styles.rejectionReason}>
              {rejection_reason || 'There was an issue with your payment proof. Please upload a new one.'}
            </p>
          </div>
          <Link 
            to={`/checkout/bank-transfer?orderId=${order.id}&orderNumber=${order_number}`}
            className={styles.reuploadBtn}
          >
            <Upload size={16} />
            Re-upload Proof
          </Link>
        </motion.div>
      )}
    </div>
  );
};

// ==========================================================================
// Helper Functions
// ==========================================================================
function getTimelineEventDate(timeline, actionNames) {
  if (!timeline || !Array.isArray(timeline)) return null;
  
  for (const name of actionNames) {
    const event = timeline.find(e => 
      e.action?.toLowerCase().includes(name.toLowerCase()) ||
      e.status?.toLowerCase().includes(name.toLowerCase())
    );
    if (event) {
      return formatDate(event.created_at || event.timestamp);
    }
  }
  return null;
}

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return `Today, ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })}`;
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default OrderTimeline;