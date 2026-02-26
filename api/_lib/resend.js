// ==========================================================================
// Resend Email Service - /api/_lib/resend.js
// ==========================================================================
// Email sending functions using Resend API
// Templates are imported from email-templates.js
// ==========================================================================

import {
  emailWrapper,
  verificationCodeTemplate,
  orderConfirmationTemplate,
  paymentProofUploadedTemplate,
  paymentConfirmedTemplate,
  paymentRejectedTemplate,
  shippingNotificationTemplate,
  deliveryConfirmationTemplate,
  adminNewOrderTemplate,
  adminPaymentProofTemplate,
} from './email-templates.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'HairByTimaBlaq <noreply@hairbytimablaq.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'orders@hairbytimablaq.com';
const STORE_NAME = 'HairByTimaBlaq';

// ==========================================================================
// Core Send Function
// ==========================================================================
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log(`✅ Email sent successfully to ${to}: ${subject}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// ==========================================================================
// Verification Code Email
// ==========================================================================
export async function sendVerificationCode(email, code) {
  const content = verificationCodeTemplate(code);
  
  return sendEmail({
    to: email,
    subject: `${code} is your ${STORE_NAME} verification code`,
    html: emailWrapper(content),
  });
}

// ==========================================================================
// Order Confirmation Email (Customer)
// ==========================================================================
export async function sendOrderConfirmation(order, bankAccount = null, exchangeRate = 1) {
  const isBankTransfer = order.payment_method === 'bank_transfer';
  const content = orderConfirmationTemplate(order, bankAccount, exchangeRate);
  
  return sendEmail({
    to: order.customer_email,
    subject: isBankTransfer 
      ? `Action Required: Complete Payment for Order ${order.order_number}` 
      : `Order Confirmed - ${order.order_number}`,
    html: emailWrapper(content),
  });
}

// ==========================================================================
// New Order Notification (Admin)
// ==========================================================================
export async function sendAdminNewOrderNotification(order) {
  const content = adminNewOrderTemplate(order);
  
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `🛒 New Order: ${order.order_number} - $${parseFloat(order.total).toFixed(2)} USD`,
    html: emailWrapper(content),
  });
}

// ==========================================================================
// Payment Proof Uploaded Notification (Admin)
// ==========================================================================
export async function sendAdminPaymentProofNotification(order) {
  const content = adminPaymentProofTemplate(order);
  
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `💳 Payment Proof: ${order.order_number} - Verify Now`,
    html: emailWrapper(content),
  });
}

// ==========================================================================
// Payment Proof Uploaded Email (Customer Confirmation)
// ==========================================================================
export async function sendPaymentProofUploaded(order, exchangeRate = 1) {
  const content = paymentProofUploadedTemplate(order, exchangeRate);
  
  return sendEmail({
    to: order.customer_email,
    subject: `Payment Proof Received - ${order.order_number}`,
    html: emailWrapper(content),
  });
}

// ==========================================================================
// Payment Confirmed Email
// ==========================================================================
export async function sendPaymentConfirmed(order, exchangeRate = 1) {
  const content = paymentConfirmedTemplate(order, exchangeRate);
  
  return sendEmail({
    to: order.customer_email,
    subject: `Payment Confirmed - ${order.order_number}`,
    html: emailWrapper(content),
  });
}

// ==========================================================================
// Payment Rejected Email
// ==========================================================================
export async function sendPaymentRejected(order) {
  const content = paymentRejectedTemplate(order);
  
  return sendEmail({
    to: order.customer_email,
    subject: `Action Required: Payment Issue - ${order.order_number}`,
    html: emailWrapper(content),
  });
}

// ==========================================================================
// Shipping Notification Email
// ==========================================================================
export async function sendShippingNotification(order, trackingNumber, carrier, courierPhone, trackingUrl) {
  const content = shippingNotificationTemplate(order, trackingNumber, carrier, courierPhone, trackingUrl);
  
  return sendEmail({
    to: order.customer_email,
    subject: `Your Order Has Shipped! - ${order.order_number}`,
    html: emailWrapper(content),
  });
}

// ==========================================================================
// Delivery Confirmation Email
// ==========================================================================
export async function sendDeliveryConfirmation(order) {
  const content = deliveryConfirmationTemplate(order);
  
  return sendEmail({
    to: order.customer_email,
    subject: `Order Delivered! - ${order.order_number}`,
    html: emailWrapper(content),
  });
}

// ==========================================================================
// Export Default (for compatibility)
// ==========================================================================
export default {
  sendEmail,
  sendVerificationCode,
  sendOrderConfirmation,
  sendAdminNewOrderNotification,
  sendAdminPaymentProofNotification,
  sendPaymentProofUploaded,
  sendPaymentConfirmed,
  sendPaymentRejected,
  sendShippingNotification,
  sendDeliveryConfirmation,
};