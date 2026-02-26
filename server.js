// =============================================================================
// HairByTimaBlaq - Express Server (replaces Vercel serverless functions)
// =============================================================================

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers (matches vercel.json)
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Parse JSON bodies (skip only for upload-proof which uses formidable)
app.use((req, res, next) => {
  if (req.path === '/api/orders/upload-proof') {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// CORS for API routes (matches vercel.json config)
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// =============================================================================
// API ROUTES - Each imports the Vercel handler and calls it directly
// =============================================================================

// --- Auth ---
import authSendCode from './api/auth/send-code.js';
import authVerifyCode from './api/auth/verify-code.js';
app.all('/api/auth/send-code', authSendCode);
app.all('/api/auth/verify-code', authVerifyCode);

// --- Admin Core ---
import adminLogin from './api/admin/login.js';
import adminLogout from './api/admin/logout.js';
import adminStats from './api/admin/stats.js';
import adminVerify from './api/admin/verify.js';
app.all('/api/admin/login', adminLogin);
app.all('/api/admin/logout', adminLogout);
app.all('/api/admin/stats', adminStats);
app.all('/api/admin/verify', adminVerify);

// --- Admin Analytics ---
import adminAnalytics from './api/admin/analytics/index.js';
app.all('/api/admin/analytics', adminAnalytics);

// --- Admin Categories ---
import adminCategories from './api/admin/categories/index.js';
app.all('/api/admin/categories', adminCategories);

// --- Admin Coupons ---
import adminCoupons from './api/admin/coupons/index.js';
app.all('/api/admin/coupons', adminCoupons);

// --- Admin Customers ---
import adminCustomers from './api/admin/customers/index.js';
app.all('/api/admin/customers', adminCustomers);

// --- Admin Messages ---
import adminMessages from './api/admin/messages/index.js';
app.all('/api/admin/messages', adminMessages);

// --- Admin Notifications ---
import adminNotifications from './api/admin/notifications/index.js';
app.all('/api/admin/notifications', adminNotifications);

// --- Admin Orders ---
import adminOrders from './api/admin/orders/index.js';
app.all('/api/admin/orders', adminOrders);

// --- Admin Products ---
import adminProducts from './api/admin/products/index.js';
import adminProductWishlists from './api/admin/products/wishlists.js';
app.all('/api/admin/products/wishlists', adminProductWishlists);
app.all('/api/admin/products', adminProducts);

// --- Admin Settings ---
import adminSettings from './api/admin/settings/index.js';
import adminSettingsBankAccounts from './api/admin/settings/bank-accounts/index.js';
import adminSettingsCurrency from './api/admin/settings/currency/index.js';
import adminSettingsShipping from './api/admin/settings/shipping/index.js';
import adminSettingsStore from './api/admin/settings/store/index.js';
import adminSettingsUpload from './api/admin/settings/upload/index.js';
app.all('/api/admin/settings/bank-accounts', adminSettingsBankAccounts);
app.all('/api/admin/settings/currency', adminSettingsCurrency);
app.all('/api/admin/settings/shipping', adminSettingsShipping);
app.all('/api/admin/settings/store', adminSettingsStore);
app.all('/api/admin/settings/upload', adminSettingsUpload);
app.all('/api/admin/settings', adminSettings);

// --- Admin Subscribers ---
import adminSubscribers from './api/admin/subscribers/index.js';
app.all('/api/admin/subscribers', adminSubscribers);

// --- Public Analytics ---
import analytics from './api/analytics/index.js';
app.all('/api/analytics', analytics);

// --- Contact ---
import contact from './api/contact/index.js';
app.all('/api/contact', contact);

// --- Coupons ---
import coupons from './api/coupons/index.js';
import couponsValidate from './api/coupons/validate.js';
app.all('/api/coupons/validate', couponsValidate);
app.all('/api/coupons', coupons);

// --- Currency ---
import currencyRates from './api/currency/rates.js';
app.all('/api/currency/rates', currencyRates);

// --- Customers ---
import customersLookup from './api/customers/lookup.js';
app.all('/api/customers/lookup', customersLookup);

// --- Emails ---
import emailsSend from './api/emails/send.js';
import emailsSendOrderConfirmation from './api/emails/send-order-confirmation.js';
import emailsSendOrderShipped from './api/emails/send-order-shipped.js';
import emailsSendVerificationCode from './api/emails/send-verification-code.js';
app.all('/api/emails/send-order-confirmation', emailsSendOrderConfirmation);
app.all('/api/emails/send-order-shipped', emailsSendOrderShipped);
app.all('/api/emails/send-verification-code', emailsSendVerificationCode);
app.all('/api/emails/send', emailsSend);

// --- Newsletter ---
import newsletter from './api/newsletter/index.js';
app.all('/api/newsletter', newsletter);

// --- Orders ---
import orders from './api/orders/index.js';
import ordersRefresh from './api/orders/refresh.js';
import ordersSendCode from './api/orders/send-code.js';
import ordersTrack from './api/orders/track.js';
import ordersUploadProof from './api/orders/upload-proof.js';
import ordersVerifyCode from './api/orders/verify-code.js';
app.all('/api/orders/refresh', ordersRefresh);
app.all('/api/orders/send-code', ordersSendCode);
app.all('/api/orders/track', ordersTrack);
app.all('/api/orders/upload-proof', ordersUploadProof);
app.all('/api/orders/verify-code', ordersVerifyCode);
app.all('/api/orders', orders);

// --- Payments ---
import paymentsBank from './api/payments/bank.js';
import klarnaCallback from './api/payments/klarna/callback.js';
import klarnaCreateSession from './api/payments/klarna/create-session.js';
app.all('/api/payments/bank', paymentsBank);
app.all('/api/payments/klarna/callback', klarnaCallback);
app.all('/api/payments/klarna/create-session', klarnaCreateSession);

// --- Products ---
import products from './api/products/index.js';
app.all('/api/products', products);

// --- Sitemap ---
import sitemapProducts from './api/sitemap/products.js';
app.all('/api/sitemap/products', sitemapProducts);

// --- Wishlists ---
import wishlists from './api/wishlists/index.js';
app.all('/api/wishlists', wishlists);

// =============================================================================
// STATIC FILES - Serve Vite build with cache headers
// =============================================================================
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    // Only cache assets (hashed filenames), not index.html
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// SPA fallback
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// =============================================================================
// START
// =============================================================================
app.listen(PORT, () => {
  console.log(`HairByTimaBlaq server running on port ${PORT}`);
});
