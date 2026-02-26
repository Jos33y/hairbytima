import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Header, Footer } from '@components/layout';
import ProtectedRoute from '@components/admin/ProtectedRoute';
import { useWishlistStore } from '@store/wishlistStore';
import { useCurrencyStore } from '@store/currencyStore';

// Analytics
import { trackPageView } from '@utils/analytics';
import { Analytics } from '@vercel/analytics/react';

// Shop Pages
import HomePage from '@pages/shop/HomePage';
import ShopPage from '@pages/shop/ShopPage';
import ProductDetailsPage from '@pages/shop/ProductDetailsPage';
import CartPage from '@pages/shop/CartPage';
import CheckoutPage from '@pages/shop/CheckoutPage';
import BankTransferPage from '@pages/shop/BankTransferPage';

// Dashboard Pages
import MyOrdersPage from '@pages/dashboard/MyOrdersPage';
import TrackOrderPage from '@pages/dashboard/TrackOrderPage';

// Static Pages
import AboutPage from '@pages/AboutPage';
import ContactPage from '@pages/ContactPage';
import FAQPage from '@pages/info/FAQPage';
import HairCarePage from '@pages/HairCarePage';

// Wishlist Pages
import WishlistPage from '@pages/WishlistPage';
import SharedWishlistPage from '@pages/SharedWishlistPage';

// Legal Pages
import {
  PrivacyPolicyPage,
  TermsOfServicePage,
  ReturnPolicyPage,
  ShippingPolicyPage
} from '@pages/legal';

// Error Pages
import NotFoundPage from '@pages/NotFoundPage';

// Admin Pages
import {
  AdminLoginPage,
  AdminDashboard,
  AdminAnalytics,
  AdminOrders,
  AdminProducts,
  AdminCustomers,
  AdminCoupons,
  AdminCategories,
  AdminSettings,
  AdminNotifications,
  AdminMessages,
  AdminSubscribers
} from '@pages/admin';


// ==========================================================================
// Page name mapping for analytics
// ==========================================================================
const PAGE_NAMES = {
  '/': 'Home',
  '/shop': 'Shop',
  '/cart': 'Cart',
  '/checkout': 'Checkout',
  '/checkout/payment': 'Bank Transfer',
  '/orders': 'My Orders',
  '/track-order': 'Track Order',
  '/wishlist': 'Wishlist',
  '/about': 'About',
  '/contact': 'Contact',
  '/faq': 'FAQ',
  '/hair-care': 'Hair Care',
  '/privacy-policy': 'Privacy Policy',
  '/terms-of-service': 'Terms of Service',
  '/return-policy': 'Return Policy',
  '/shipping-policy': 'Shipping Policy',
};

// ==========================================================================
// Scroll to top & Analytics tracking on route change
// ==========================================================================
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Track page view (skip admin routes)
    if (!location.pathname.startsWith('/admin')) {
      let pageName = PAGE_NAMES[location.pathname];

      // Handle dynamic routes
      if (!pageName) {
        if (location.pathname.startsWith('/product/')) {
          pageName = 'Product Detail';
        } else if (location.pathname.startsWith('/shop/')) {
          pageName = 'Shop Category';
        } else if (location.pathname.startsWith('/wishlist/shared/')) {
          pageName = 'Shared Wishlist';
        } else {
          pageName = 'Page';
        }
      }

      trackPageView(pageName, {
        path: location.pathname,
        search: location.search,
      });
    }
  }, [location.pathname, location.search]);

  return null;
};

// Layout wrapper for customer pages
const MainLayout = ({ children }) => (
  <>
    <Header />
    <main className="hbt-main">{children}</main>
    <Footer />
  </>
);

function App() {
  // Initialize stores on app mount
  useEffect(() => {
    // Initialize currency (fetch exchange rates)
    useCurrencyStore.getState().initialize();

    // Initialize wishlist (sync with Supabase)
    useWishlistStore.getState().initialize();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ============================================
            CUSTOMER ROUTES
            ============================================ */}

        {/* Home */}
        <Route
          path="/"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

        {/* Shop Routes */}
        <Route
          path="/shop"
          element={
            <MainLayout>
              <ShopPage />
            </MainLayout>
          }
        />
        <Route
          path="/shop/:category"
          element={
            <MainLayout>
              <ShopPage />
            </MainLayout>
          }
        />
        <Route
          path="/shop/:category/:subcategory"
          element={
            <MainLayout>
              <ShopPage />
            </MainLayout>
          }
        />

        {/* Product Details */}
        <Route
          path="/product/:slug"
          element={
            <MainLayout>
              <ProductDetailsPage />
            </MainLayout>
          }
        />

        {/* Cart & Checkout */}
        <Route
          path="/cart"
          element={
            <MainLayout>
              <CartPage />
            </MainLayout>
          }
        />
        <Route
          path="/checkout"
          element={
            <MainLayout>
              <CheckoutPage />
            </MainLayout>
          }
        />
        <Route
          path="/checkout/payment"
          element={
            <MainLayout>
              <BankTransferPage />
            </MainLayout>
          }
        />

        {/* User Dashboard */}
        <Route
          path="/orders"
          element={
            <MainLayout>
              <MyOrdersPage />
            </MainLayout>
          }
        />
        <Route
          path="/track-order"
          element={
            <MainLayout>
              <TrackOrderPage />
            </MainLayout>
          }
        />
        <Route
          path="/wishlist"
          element={
            <MainLayout>
              <WishlistPage />
            </MainLayout>
          }
        />
        <Route
          path="/wishlist/shared/:visitorId"
          element={
            <MainLayout>
              <SharedWishlistPage />
            </MainLayout>
          }
        />

        {/* Static Pages */}
        <Route
          path="/about"
          element={
            <MainLayout>
              <AboutPage />
            </MainLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <MainLayout>
              <ContactPage />
            </MainLayout>
          }
        />
        <Route
          path="/faq"
          element={
            <MainLayout>
              <FAQPage />
            </MainLayout>
          }
        />
        <Route
          path="/hair-care"
          element={
            <MainLayout>
              <HairCarePage />
            </MainLayout>
          }
        />

        {/* Legal Pages */}
        <Route
          path="/privacy-policy"
          element={
            <MainLayout>
              <PrivacyPolicyPage />
            </MainLayout>
          }
        />
        <Route
          path="/terms-of-service"
          element={
            <MainLayout>
              <TermsOfServicePage />
            </MainLayout>
          }
        />
        <Route
          path="/return-policy"
          element={
            <MainLayout>
              <ReturnPolicyPage />
            </MainLayout>
          }
        />
        <Route
          path="/shipping-policy"
          element={
            <MainLayout>
              <ShippingPolicyPage />
            </MainLayout>
          }
        />

        {/* ============================================
            ADMIN ROUTES
            ============================================ */}

        {/* Admin Login - No auth required */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Dashboard - Protected (manager+) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="manager">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Analytics - Protected (manager+) */}
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requiredRole="manager">
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Admin Orders - Protected (manager+) */}
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute requiredRole="manager">
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <ProtectedRoute requiredRole="manager">
              <AdminOrders />
            </ProtectedRoute>
          }
        />

        {/* Admin Products - Protected (admin+) */}
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProducts />
            </ProtectedRoute>
          }
        />

        {/* Admin Coupons - Protected (admin+) */}
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCoupons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons/new"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCoupons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCoupons />
            </ProtectedRoute>
          }
        />

        {/* Admin Categories - Protected (admin+) */}
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCategories />
            </ProtectedRoute>
          }
        />

        {/* Admin Customers - Protected (admin+) */}
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCustomers />
            </ProtectedRoute>
          }
        />

        {/* Admin Messages - Protected (manager+) */}
        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute requiredRole="manager">
              <AdminMessages />
            </ProtectedRoute>
          }
        />

        {/* Admin Subscribers - Protected (admin+) */}
        <Route
          path="/admin/subscribers"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminSubscribers />
            </ProtectedRoute>
          }
        />

        {/* Admin Settings - Protected (admin+) */}
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        {/* Admin Notifications - Protected (manager+) */}
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute requiredRole="manager">
              <AdminNotifications />
            </ProtectedRoute>
          }
        />

        {/* ============================================
            404 CATCH-ALL ROUTE (Must be last!)
            ============================================ */}
        <Route
          path="*"
          element={
            <MainLayout>
              <NotFoundPage />
            </MainLayout>
          }
        />
      </Routes>
     {import.meta.env.PROD && <Analytics />}
    </>
  );
}

export default App;