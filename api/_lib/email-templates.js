// ==========================================================================
// Email Templates - /api/_lib/email-templates.js
// ==========================================================================
// Pure HTML templates only - No sending logic
// Import into resend.js for actual sending
// ==========================================================================

const STORE_NAME = 'HairByTimaBlaq';
const STORE_URL = process.env.VITE_SITE_URL || 'https://hairbytimablaq.com';

// ==========================================================================
// Currency Configuration (mirrors frontend currencyStore)
// ==========================================================================
const CURRENCY_CONFIG = {
  USD: { symbol: '$', decimals: 2 },
  GBP: { symbol: '£', decimals: 2 },
  EUR: { symbol: '€', decimals: 2 },
  NGN: { symbol: '₦', decimals: 0 },
  GMD: { symbol: 'D', decimals: 2 },
};

// ==========================================================================
// Price Formatting Helper
// Converts USD amount to target currency and formats with symbol
// ==========================================================================
function formatPrice(amountInUSD, currency, exchangeRate = 1) {
  if (!amountInUSD || isNaN(amountInUSD)) return CURRENCY_CONFIG[currency]?.symbol + '0';
  
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
  const convertedAmount = parseFloat(amountInUSD) * exchangeRate;
  
  const formatted = convertedAmount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  
  return `${config.symbol}${formatted}`;
}

// ==========================================================================
// Base Email Wrapper - FORCED DARK MODE (works in light AND dark mode)
// ==========================================================================
export function emailWrapper(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${STORE_NAME}</title>
  <style>
    /* Force dark mode in ALL scenarios */
    :root {
      color-scheme: only dark;
      supported-color-schemes: dark;
    }
    
    /* Prevent Gmail from inverting colors in light mode */
    * {
      color-scheme: dark !important;
    }
    
    /* Gmail light mode - force dark */
    u + .body {
      background-color: #0a0a0a !important;
    }
    
    /* Gmail dark mode */
    [data-ogsc] .body,
    [data-ogsb] .body {
      background-color: #0a0a0a !important;
    }
    
    /* Outlook */
    [data-ogsc] body,
    [data-ogsb] body {
      background-color: #0a0a0a !important;
    }
    
    /* Force dark in BOTH light and dark mode */
    @media (prefers-color-scheme: light) {
      .body, body {
        background-color: #0a0a0a !important;
      }
      .email-container {
        background-color: #141414 !important;
      }
      .dark-bg {
        background-color: #1a1a1a !important;
      }
    }
    
    @media (prefers-color-scheme: dark) {
      .body, body {
        background-color: #0a0a0a !important;
      }
      .email-container {
        background-color: #141414 !important;
      }
      .dark-bg {
        background-color: #1a1a1a !important;
      }
    }
    
    /* Prevent text color inversion */
    .white-text { color: #ffffff !important; }
    .gray-text { color: #888888 !important; }
    .pink-text { color: #EC4899 !important; }
    .gold-text { color: #D4AF37 !important; }
    .green-text { color: #22c55e !important; }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, div, p { background-color: #0a0a0a !important; }
    .email-container { background-color: #141414 !important; }
  </style>
  <![endif]-->
</head>
<body class="body" style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;" bgcolor="#0a0a0a">
  <!-- Wrapper table for full-width dark background -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color: #0a0a0a; padding: 40px 20px;" bgcolor="#0a0a0a">
    <tr>
      <td align="center" valign="top" style="background-color: #0a0a0a;" bgcolor="#0a0a0a">
        <!-- Main container -->
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width: 600px; background-color: #141414; border-radius: 16px; overflow: hidden;" bgcolor="#141414">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; text-align: center; border-bottom: 1px solid #222; background-color: #141414;" bgcolor="#141414">
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 400; color: #EC4899; letter-spacing: 2px;" class="pink-text">
                ${STORE_NAME}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px; background-color: #141414;" bgcolor="#141414">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0a0a0a; text-align: center; border-top: 1px solid #222;" bgcolor="#0a0a0a">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #888;" class="gray-text">
                ${STORE_NAME} - Premium Hair Extensions
              </p>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #666;">
                <a href="${STORE_URL}" style="color: #EC4899; text-decoration: none;" class="pink-text">Visit our store</a>
                &nbsp;•&nbsp;
                <a href="${STORE_URL}/contact" style="color: #EC4899; text-decoration: none;" class="pink-text">Contact us</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #555;">
                Not seeing our emails? Check your spam or promotions folder and add us to your contacts.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ==========================================================================
// Verification Code Template
// ==========================================================================
export function verificationCodeTemplate(code) {
  return `
    <div style="text-align: center;">
      <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 500; color: #fff !important;">
        Your Verification Code
      </h2>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #999 !important; line-height: 1.6;">
        Use this code to access your orders. It expires in 10 minutes.
      </p>
      
      <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05)); border: 2px solid rgba(236, 72, 153, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #EC4899 !important;">
          ${code}
        </span>
      </div>
      
      <p style="margin: 0; font-size: 14px; color: #666 !important;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  `;
}

// ==========================================================================
// Order Items HTML Generator (Internal Helper)
// NOW WITH CURRENCY CONVERSION
// ==========================================================================
function generateOrderItemsHtml(items, currency, exchangeRate = 1) {
  if (!items || items.length === 0) return '';
  
  return items.map(item => {
    const itemName = item.product_name || item.name || 'Product';
    const itemImage = item.product_image || item.image || '';
    const quantity = item.quantity || 1;
    
    // Get unit price in USD
    const unitPriceUSD = parseFloat(item.unit_price || item.price || 0);
    const totalPriceUSD = parseFloat(item.total_price) || (unitPriceUSD * quantity);
    
    // Convert to order's currency
    const formattedPrice = formatPrice(totalPriceUSD, currency, exchangeRate);
    
    return `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #222;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="60" style="vertical-align: top;">
              <img src="${itemImage}" alt="${itemName}" 
                   style="width: 56px; height: 56px; object-fit: cover; object-position: top; border-radius: 8px; background-color: #222;">
            </td>
            <td style="padding-left: 16px; vertical-align: top;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #fff !important; font-weight: 500;">
                ${itemName}
              </p>
              <p style="margin: 0; font-size: 13px; color: #888 !important;">
                ${item.length ? `Length: ${item.length}" • ` : ''}Qty: ${quantity}
              </p>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <p style="margin: 0; font-size: 14px; color: #fff !important;">
                ${formattedPrice}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  }).join('');
}

// ==========================================================================
// Order Confirmation Template
// NOW ACCEPTS exchangeRate PARAMETER
// ==========================================================================
export function orderConfirmationTemplate(order, bankAccount = null, exchangeRate = 1) {
  const isBankTransfer = order.payment_method === 'bank_transfer';
  const paymentLink = `${STORE_URL}/checkout/payment?orderId=${order.id}`;
  const trackLink = `${STORE_URL}/track-order?orderNumber=${order.order_number}`;
  const currency = order.currency || 'USD';
  
  // Generate items with currency conversion
  const itemsHtml = generateOrderItemsHtml(order.items, currency, exchangeRate);
  
  // Format all prices with conversion
  const formattedSubtotal = formatPrice(order.subtotal, currency, exchangeRate);
  const formattedDiscount = formatPrice(order.discount, currency, exchangeRate);
  const formattedShipping = formatPrice(order.shipping_cost, currency, exchangeRate);
  const formattedTotal = formatPrice(order.total, currency, exchangeRate);

  return `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(236, 72, 153, 0.1); border-radius: 50%; margin: 0 auto 16px; display: inline-block; line-height: 64px;">
        <span style="font-size: 32px;">🛍️</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 500; color: #fff !important;">
        ${isBankTransfer ? 'Order Received!' : 'Order Confirmed!'}
      </h2>
      <p style="margin: 0; font-size: 16px; color: #999 !important;">
        ${isBankTransfer 
          ? 'Complete your payment to confirm your order' 
          : 'Thank you for your purchase'}
      </p>
    </div>

    <!-- Order Number -->
    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #888 !important; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
      <p style="margin: 0; font-size: 24px; font-weight: 600; color: #EC4899 !important; font-family: monospace; letter-spacing: 2px;">
        ${order.order_number}
      </p>
    </div>

    ${isBankTransfer ? `
    <!-- Payment Required Notice - Link to payment page (no bank details in email) -->
    <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05)); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 16px; padding: 28px; margin: 28px 0; text-align: center;">
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; padding: 6px 16px; background: rgba(255, 193, 7, 0.2); border-radius: 20px; font-size: 12px; font-weight: 600; color: #fbbf24 !important; text-transform: uppercase; letter-spacing: 1px;">
          Action Required
        </span>
      </div>
      
      <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #D4AF37 !important;">
        Complete Your Payment
      </h3>
      
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #999 !important; line-height: 1.6;">
        Your order has been reserved. Visit our secure payment page to view bank transfer details and upload your payment proof.
      </p>
      
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #888 !important;">
        Payment must be completed within <strong style="color: #fbbf24 !important;">24 hours</strong> to confirm your order.
      </p>
      
      <a href="${paymentLink}" 
         style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #D4AF37 0%, #F7DC6F 100%); color: #000 !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Complete Payment Now
      </a>
    </div>
    ` : ''}

    <!-- Order Items -->
    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px 0; font-size: 14px; color: #888 !important; text-transform: uppercase; letter-spacing: 1px;">
        Order Items
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${itemsHtml}
      </table>
    </div>

    <!-- Order Summary -->
    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Subtotal</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${formattedSubtotal}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #22c55e !important;">Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}</td>
          <td style="padding: 8px 0; color: #22c55e !important; text-align: right;">-${formattedDiscount}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Shipping</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${parseFloat(order.shipping_cost) === 0 ? 'Free' : formattedShipping}</td>
        </tr>
        <tr>
          <td style="padding: 16px 0 0; color: #fff !important; font-weight: 600; font-size: 16px; border-top: 1px solid #333;">Total</td>
          <td style="padding: 16px 0 0; color: #EC4899 !important; text-align: right; font-weight: 700; font-size: 18px; border-top: 1px solid #333;">${formattedTotal}</td>
        </tr>
      </table>
    </div>

    <!-- Shipping Address -->
    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #888 !important; text-transform: uppercase; letter-spacing: 1px;">
        Shipping To
      </h3>
      <p style="margin: 0; font-size: 14px; color: #fff !important; line-height: 1.6;">
        ${order.shipping_first_name} ${order.shipping_last_name}<br>
        ${order.shipping_address}<br>
        ${order.shipping_apartment ? `${order.shipping_apartment}<br>` : ''}
        ${order.shipping_city}${order.shipping_state ? `, ${order.shipping_state}` : ''} ${order.shipping_postal_code || ''}<br>
        ${order.shipping_country}
      </p>
    </div>

    <!-- CTA Buttons -->
    <div style="text-align: center;">
      ${isBankTransfer ? `
        <a href="${paymentLink}" 
           style="display: inline-block; padding: 14px 32px; background-color: #EC4899; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; margin-bottom: 12px;">
          Complete Payment
        </a>
        <br>
        <a href="${trackLink}" 
           style="display: inline-block; padding: 10px 24px; background-color: transparent; color: #EC4899 !important; text-decoration: none; border: 1px solid #EC4899; border-radius: 8px; font-weight: 500; font-size: 14px;">
          Track Your Order
        </a>
      ` : `
        <a href="${trackLink}" 
           style="display: inline-block; padding: 14px 32px; background-color: #EC4899; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
          Track Your Order
        </a>
      `}
    </div>
  `;
}

// ==========================================================================
// Payment Proof Uploaded Template (Customer Confirmation)
// ==========================================================================
export function paymentProofUploadedTemplate(order, exchangeRate = 1) {
  const trackLink = `${STORE_URL}/track-order?orderNumber=${order.order_number}`;
  const currency = order.currency || 'USD';
  const formattedTotal = formatPrice(order.total, currency, exchangeRate);

  return `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(34, 197, 94, 0.1); border-radius: 50%; margin: 0 auto 16px; display: inline-block; line-height: 64px;">
        <span style="font-size: 32px;">✅</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 500; color: #fff !important;">
        Payment Proof Received!
      </h2>
      <p style="margin: 0; font-size: 16px; color: #999 !important;">
        We're verifying your payment
      </p>
    </div>

    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Order Number</td>
          <td style="padding: 8px 0; color: #EC4899 !important; text-align: right; font-family: monospace; font-weight: 600;">${order.order_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Amount</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right; font-weight: 600;">${formattedTotal}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Status</td>
          <td style="padding: 8px 0; color: #fbbf24 !important; text-align: right;">Pending Verification</td>
        </tr>
      </table>
    </div>

    <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #D4AF37 !important; line-height: 1.6;">
        Our team will verify your payment within 24 hours. You'll receive an email once confirmed.
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${trackLink}" 
         style="display: inline-block; padding: 14px 32px; background-color: #EC4899; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Track Your Order
      </a>
    </div>
  `;
}

// ==========================================================================
// Payment Confirmed Template
// ==========================================================================
export function paymentConfirmedTemplate(order, exchangeRate = 1) {
  const trackLink = `${STORE_URL}/track-order?orderNumber=${order.order_number}`;
  const currency = order.currency || 'USD';
  const formattedTotal = formatPrice(order.total, currency, exchangeRate);

  return `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(34, 197, 94, 0.1); border-radius: 50%; margin: 0 auto 16px; display: inline-block; line-height: 64px;">
        <span style="font-size: 32px;">🎉</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 500; color: #fff !important;">
        Payment Confirmed!
      </h2>
      <p style="margin: 0; font-size: 16px; color: #999 !important;">
        Your order is now being processed
      </p>
    </div>

    <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #888 !important;">Payment of</p>
      <p style="margin: 0; font-size: 28px; font-weight: 700; color: #22c55e !important;">
        ${formattedTotal}
      </p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #888 !important;">has been received</p>
    </div>

    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Order Number</td>
          <td style="padding: 8px 0; color: #EC4899 !important; text-align: right; font-family: monospace;">${order.order_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Status</td>
          <td style="padding: 8px 0; color: #22c55e !important; text-align: right;">Processing</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <p style="margin: 0 0 20px 0; font-size: 14px; color: #888 !important;">
        We'll notify you when your order ships.
      </p>
      <a href="${trackLink}" 
         style="display: inline-block; padding: 14px 32px; background-color: #EC4899; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Track Your Order
      </a>
    </div>
  `;
}

// ==========================================================================
// Shipping Notification Template
// ==========================================================================
export function shippingNotificationTemplate(order, trackingNumber, carrier, courierPhone, trackingUrl) {
  const trackLink = `${STORE_URL}/track-order?orderNumber=${order.order_number}`;
  
  return `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(139, 92, 246, 0.1); border-radius: 50%; margin: 0 auto 16px; display: inline-block; line-height: 64px;">
        <span style="font-size: 32px;">📦</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 500; color: #fff !important;">
        Your Order Has Shipped!
      </h2>
      <p style="margin: 0; font-size: 16px; color: #999 !important;">
        Great news! Your order is on its way.
      </p>
    </div>

    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Order Number</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right; font-family: monospace;">${order.order_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Carrier</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${carrier || 'Standard Shipping'}</td>
        </tr>
        ${trackingNumber ? `
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Tracking Number</td>
          <td style="padding: 8px 0; color: #EC4899 !important; text-align: right; font-family: monospace; font-weight: 600;">${trackingNumber}</td>
        </tr>
        ` : ''}
        ${courierPhone ? `
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Courier Phone</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">
            <a href="tel:${courierPhone}" style="color: #EC4899 !important; text-decoration: none;">${courierPhone}</a>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #888 !important; text-transform: uppercase; letter-spacing: 1px;">
        Shipping To
      </h3>
      <p style="margin: 0; font-size: 14px; color: #fff !important; line-height: 1.6;">
        ${order.shipping_first_name} ${order.shipping_last_name}<br>
        ${order.shipping_address}<br>
        ${order.shipping_apartment ? `${order.shipping_apartment}<br>` : ''}
        ${order.shipping_city}${order.shipping_state ? `, ${order.shipping_state}` : ''} ${order.shipping_postal_code || ''}<br>
        ${order.shipping_country}
      </p>
    </div>

    <div style="text-align: center;">
      ${trackingUrl ? `
      <a href="${trackingUrl}" 
         style="display: inline-block; padding: 14px 32px; background-color: #EC4899; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; margin-bottom: 12px;">
        Track Your Package
      </a>
      <br>
      ` : ''}
      <a href="${trackLink}" 
         style="display: inline-block; padding: 14px 32px; background: ${trackingUrl ? 'transparent' : '#EC4899'}; color: ${trackingUrl ? '#EC4899' : '#fff'} !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; ${trackingUrl ? 'border: 1px solid #EC4899;' : ''}">
        ${trackingUrl ? 'View Order Details' : 'Track Your Order'}
      </a>
    </div>
  `;
}

// ==========================================================================
// Delivery Confirmation Template
// ==========================================================================
export function deliveryConfirmationTemplate(order) {
  return `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(34, 197, 94, 0.1); border-radius: 50%; margin: 0 auto 16px; display: inline-block; line-height: 64px;">
        <span style="font-size: 32px;">🎉</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 500; color: #fff !important;">
        Your Order Has Been Delivered!
      </h2>
      <p style="margin: 0; font-size: 16px; color: #999 !important;">
        We hope you love your new hair!
      </p>
    </div>

    <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 16px; color: #22c55e !important;">
        Order ${order.order_number} has been delivered.
      </p>
    </div>

    <div style="text-align: center;">
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #888 !important;">
        Have questions or need help? We're here for you.
      </p>
      <a href="${STORE_URL}/contact" 
         style="display: inline-block; padding: 14px 32px; background-color: #EC4899; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        Contact Us
      </a>
    </div>
  `;
}

// ==========================================================================
// Admin Notification: New Order Template
// Shows USD amounts for admin (internal reference)
// ==========================================================================
export function adminNewOrderTemplate(order) {
  const adminLink = `${STORE_URL}/admin/orders?id=${order.id}`;
  
  // Admin sees both USD (stored) and customer's currency for reference
  const currency = order.currency || 'USD';
  
  return `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(236, 72, 153, 0.1); border-radius: 50%; margin: 0 auto 16px; display: inline-block; line-height: 64px;">
        <span style="font-size: 32px;">🛒</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 500; color: #fff !important;">
        New Order Received!
      </h2>
      <p style="margin: 0; font-size: 16px; color: #999 !important;">
        Order ${order.order_number} needs attention
      </p>
    </div>

    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Order Number</td>
          <td style="padding: 8px 0; color: #EC4899 !important; text-align: right; font-family: monospace; font-weight: 600;">${order.order_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Customer</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${order.shipping_first_name} ${order.shipping_last_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Email</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${order.customer_email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Total (USD)</td>
          <td style="padding: 8px 0; color: #22c55e !important; text-align: right; font-weight: 600;">$${parseFloat(order.total).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Customer Currency</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${currency}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Payment Method</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Klarna'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Items</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${order.items?.length || 0} item(s)</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${adminLink}" 
         style="display: inline-block; padding: 14px 32px; background-color: #EC4899; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
        View Order Details
      </a>
    </div>
  `;
}

// ==========================================================================
// Admin Notification: Payment Proof Uploaded
// Urgent notification when customer uploads payment proof
// ==========================================================================
export function adminPaymentProofTemplate(order) {
  const adminLink = `${STORE_URL}/admin/orders?id=${order.id}`;
  
  return `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(251, 191, 36, 0.1); border-radius: 50%; margin: 0 auto 16px; display: inline-block; line-height: 64px;">
        <span style="font-size: 32px;">💳</span>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 500; color: #fff !important;">
        Payment Proof Uploaded!
      </h2>
      <p style="margin: 0; font-size: 16px; color: #999 !important;">
        Verification required for ${order.order_number}
      </p>
    </div>

    <div style="background: rgba(251, 191, 36, 0.1); border: 2px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #fbbf24 !important; font-weight: 500;">
        ⚡ Action Required: Verify payment and confirm order
      </p>
    </div>

    <div style="background-color: #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Order Number</td>
          <td style="padding: 8px 0; color: #EC4899 !important; text-align: right; font-family: monospace; font-weight: 600;">${order.order_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Customer Email</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${order.customer_email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Amount (USD)</td>
          <td style="padding: 8px 0; color: #22c55e !important; text-align: right; font-weight: 600;">$${parseFloat(order.total).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888 !important;">Customer Currency</td>
          <td style="padding: 8px 0; color: #fff !important; text-align: right;">${order.currency || 'USD'}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${adminLink}" 
         style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #D4AF37 0%, #F7DC6F 100%); color: #000 !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Review Payment Proof
      </a>
    </div>
  `;
}

// ==========================================================================
// Payment Rejected Email Template (Customer)
// ==========================================================================
export function paymentRejectedTemplate(order) {
  const customerName = order.shipping_first_name || order.customer_name?.split(' ')[0] || 'Valued Customer';
  const trackOrderLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hairbytimablaq.com'}/track-order?orderNumber=${order.order_number}`;
  const bankTransferLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hairbytimablaq.com'}/checkout/bank-transfer?orderId=${order.id}&orderNumber=${order.order_number}`;

  return `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: rgba(239, 68, 68, 0.15); border-radius: 50%; line-height: 80px; margin-bottom: 16px;">
        <span style="font-size: 36px;">⚠️</span>
      </div>
      <h1 style="color: #fff !important; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 500; margin: 0 0 8px;">
        Payment Verification Issue
      </h1>
      <p style="color: #888 !important; font-size: 15px; margin: 0;">
        Order ${order.order_number}
      </p>
    </div>

    <p style="color: #ccc !important; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
      Hi ${customerName},
    </p>

    <p style="color: #ccc !important; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
      We were unable to verify the payment proof you submitted for your order. Please review the reason below and upload a new proof of payment.
    </p>

    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #f87171 !important; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">
        Reason
      </p>
      <p style="color: #fca5a5 !important; font-size: 15px; line-height: 1.6; margin: 0;">
        ${order.rejection_reason || 'Payment proof could not be verified. Please upload a clear image or PDF of your payment confirmation.'}
      </p>
    </div>

    <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="color: #888 !important; font-size: 13px; margin: 0 0 12px;">
        Tips for a successful upload:
      </p>
      <ul style="color: #aaa !important; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Ensure the image is clear and readable</li>
        <li>Include the transaction reference number</li>
        <li>Show the amount transferred</li>
        <li>Show the date of transfer</li>
      </ul>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${bankTransferLink}" 
         style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #EC4899 0%, #D946EF 100%); color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
        Upload New Payment Proof
      </a>
    </div>

    <p style="color: #888 !important; font-size: 14px; line-height: 1.6; text-align: center;">
      If you have any questions, please contact our support team.
    </p>
  `;
}

export default {
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
};