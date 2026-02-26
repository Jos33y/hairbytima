// ==========================================================================
// Analytics Utility - Event Tracking
// ==========================================================================
// Centralized analytics tracking for HairByTimaBlaq
// Sends events to /api/analytics endpoint for storage
// No external dependencies - works with React 19
// ==========================================================================

const API_URL = import.meta.env.VITE_API_URL || '';
const IS_DEV = import.meta.env.DEV;

// ==========================================================================
// Event Types - Matches conversion funnel in AdminAnalytics
// ==========================================================================
export const EVENTS = {
  // Page views
  PAGE_VIEW: 'page_view',
  
  // Product interactions
  PRODUCT_VIEW: 'product_view',
  PRODUCT_CLICK: 'product_click',
  
  // Cart actions
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  UPDATE_CART_QUANTITY: 'update_cart_quantity',
  VIEW_CART: 'view_cart',
  
  // Wishlist actions
  ADD_TO_WISHLIST: 'add_to_wishlist',
  REMOVE_FROM_WISHLIST: 'remove_from_wishlist',
  SHARE_WISHLIST: 'share_wishlist',
  
  // Checkout funnel (these map to admin funnel)
  CHECKOUT_START: 'checkout_start',      // Begin checkout
  ADD_CONTACT_INFO: 'add_contact_info',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  SELECT_PAYMENT_METHOD: 'select_payment_method',
  UPLOAD_PAYMENT_PROOF: 'upload_payment_proof',
  CHECKOUT_COMPLETE: 'checkout_complete',
  PURCHASE: 'purchase',
  
  // Coupon
  APPLY_COUPON: 'apply_coupon',
  REMOVE_COUPON: 'remove_coupon',
  
  // Search
  SEARCH: 'search',
  
  // Newsletter
  NEWSLETTER_SUBSCRIBE: 'newsletter_subscribe',
  
  // Contact
  CONTACT_FORM_SUBMIT: 'contact_form_submit',
  
  // Order tracking
  TRACK_ORDER: 'track_order',
  VIEW_MY_ORDERS: 'view_my_orders',
  
  // Errors
  ERROR: 'error',
};

// ==========================================================================
// Visitor & Session Management
// ==========================================================================

const getVisitorId = () => {
  try {
    let visitorId = localStorage.getItem('hbt_visitor_id');
    if (!visitorId) {
      visitorId = 'v_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('hbt_visitor_id', visitorId);
    }
    return visitorId;
  } catch {
    return 'v_' + Date.now().toString(36);
  }
};

const getSessionId = () => {
  try {
    let sessionId = sessionStorage.getItem('hbt_session_id');
    if (!sessionId) {
      sessionId = 's_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('hbt_session_id', sessionId);
    }
    return sessionId;
  } catch {
    return 's_' + Date.now().toString(36);
  }
};

// ==========================================================================
// Device Detection
// ==========================================================================

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
};

const getBrowser = (ua) => {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return 'Unknown';
};

const getOS = (ua) => {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
};

// ==========================================================================
// Core Tracking Function
// ==========================================================================

/**
 * Track an analytics event
 * @param {string} eventType - Event type from EVENTS constant
 * @param {object} eventData - Additional event data
 */
export const trackEvent = async (eventType, eventData = {}) => {
  try {
    const ua = navigator.userAgent;
    
    // Build payload matching database table columns
    const payload = {
      // Required
      event_type: eventType,
      
      // IDs
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      
      // Page info
      page_url: window.location.href,
      referrer: document.referrer || null,
      
      // Device (single field in DB)
      device_type: getDeviceType(),
      
      // Product/Order IDs (if provided)
      product_id: eventData.product_id || null,
      order_id: eventData.order_id || null,
      
      // Everything else goes in metadata (JSONB)
      metadata: {
        ...eventData,
        page_path: window.location.pathname,
        browser: getBrowser(ua),
        os: getOS(ua),
        screen_width: window.screen?.width,
        screen_height: window.screen?.height,
        language: navigator.language,
        timestamp: new Date().toISOString(),
      },
      
      // Country - will be set by API if possible
      country: null,
    };

    // Remove product_id and order_id from metadata (already top-level)
    delete payload.metadata.product_id;
    delete payload.metadata.order_id;

    // Send to API (fire and forget)
    fetch(`${API_URL}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail - don't break user experience for analytics
    });

    // Log to console in development
    if (IS_DEV) {
      console.log('📊 Analytics:', eventType, eventData);
    }
  } catch (error) {
    // Silently fail
    if (IS_DEV) {
      console.error('Analytics error:', error);
    }
  }
};

// ==========================================================================
// Convenience Functions
// ==========================================================================

/**
 * Track page view
 */
export const trackPageView = (pageName, additionalData = {}) => {
  trackEvent(EVENTS.PAGE_VIEW, {
    page_name: pageName,
    ...additionalData,
  });
};

/**
 * Track product view
 */
export const trackProductView = (product) => {
  trackEvent(EVENTS.PRODUCT_VIEW, {
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    product_category: product.category,
    product_price: product.price,
  });
};

/**
 * Track add to cart
 */
export const trackAddToCart = (product, quantity, variant = null) => {
  trackEvent(EVENTS.ADD_TO_CART, {
    product_id: product.id,
    product_name: product.name,
    product_price: product.price,
    quantity,
    variant,
    value: product.price * quantity,
  });
};

/**
 * Track remove from cart
 */
export const trackRemoveFromCart = (product, quantity) => {
  trackEvent(EVENTS.REMOVE_FROM_CART, {
    product_id: product.id,
    product_name: product.name,
    quantity,
  });
};

/**
 * Track begin checkout
 */
export const trackBeginCheckout = (items, subtotal) => {
  trackEvent(EVENTS.CHECKOUT_START, {
    items_count: Array.isArray(items) ? items.length : (items?.items?.length || 0),
    subtotal: subtotal || items?.subtotal || 0,
  });
};

/**
 * Track checkout step
 */
export const trackCheckoutStep = (step, data = {}) => {
  const stepEvents = {
    contact: EVENTS.ADD_CONTACT_INFO,
    shipping: EVENTS.ADD_SHIPPING_INFO,
    payment: EVENTS.SELECT_PAYMENT_METHOD,
    proof: EVENTS.UPLOAD_PAYMENT_PROOF,
  };
  
  if (stepEvents[step]) {
    trackEvent(stepEvents[step], data);
  }
};

/**
 * Track purchase completed
 */
export const trackPurchase = (order) => {
  trackEvent(EVENTS.PURCHASE, {
    order_id: order.id || order.orderNumber,
    order_number: order.orderNumber,
    order_total: order.total,
    subtotal: order.subtotal,
    shipping: order.shippingCost,
    discount: order.discount || 0,
    coupon_code: order.couponCode || null,
    payment_method: order.paymentMethod,
    items_count: order.items?.length || 0,
    currency: order.currency,
  });
};

/**
 * Track search
 */
export const trackSearch = (query, resultsCount) => {
  trackEvent(EVENTS.SEARCH, {
    search_query: query,
    results_count: resultsCount,
  });
};

/**
 * Track coupon applied
 */
export const trackApplyCoupon = (code, discount) => {
  trackEvent(EVENTS.APPLY_COUPON, {
    coupon_code: code,
    discount_amount: discount,
  });
};

/**
 * Track coupon removed
 */
export const trackRemoveCoupon = (code) => {
  trackEvent(EVENTS.REMOVE_COUPON, {
    coupon_code: code,
  });
};

/**
 * Track update cart quantity
 */
export const trackUpdateCartQuantity = (product, oldQuantity, newQuantity) => {
  trackEvent(EVENTS.UPDATE_CART_QUANTITY, {
    product_id: product.id,
    product_name: product.name,
    old_quantity: oldQuantity,
    new_quantity: newQuantity,
  });
};

/**
 * Track view cart
 */
export const trackViewCart = (items, subtotal) => {
  trackEvent(EVENTS.VIEW_CART, {
    items_count: items?.length || 0,
    subtotal: subtotal,
  });
};

/**
 * Track select payment method
 */
export const trackSelectPaymentMethod = (method) => {
  trackEvent(EVENTS.SELECT_PAYMENT_METHOD, {
    payment_method: method,
  });
};

/**
 * Track upload payment proof
 */
export const trackUploadPaymentProof = (orderNumber) => {
  trackEvent(EVENTS.UPLOAD_PAYMENT_PROOF, {
    order_number: orderNumber,
  });
};

/**
 * Track contact form submission
 */
export const trackContactFormSubmit = (subject) => {
  trackEvent(EVENTS.CONTACT_FORM_SUBMIT, {
    subject: subject,
  });
};

/**
 * Track newsletter subscription
 */
export const trackNewsletterSubscribe = (email) => {
  // Don't store actual email, just track the event
  trackEvent(EVENTS.NEWSLETTER_SUBSCRIBE, {
    subscribed: true,
  });
};

/**
 * Track wishlist actions
 */
export const trackWishlistAdd = (product) => {
  trackEvent(EVENTS.ADD_TO_WISHLIST, {
    product_id: product.id,
    product_name: product.name,
  });
};

export const trackWishlistRemove = (product) => {
  trackEvent(EVENTS.REMOVE_FROM_WISHLIST, {
    product_id: product.id,
    product_name: product.name,
  });
};

/**
 * Track error
 */
const trackError = (errorType, errorMessage, context = {}) => {
  trackEvent(EVENTS.ERROR, {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
  });
};

// ==========================================================================
// Default Export
// ==========================================================================

