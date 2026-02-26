// ==========================================================================
// SEO Component - Page-specific meta tags (No external dependencies)
// ==========================================================================
// Works with React 19 - uses native DOM manipulation instead of react-helmet
// Usage: <SEO title="Shop" description="Browse our collection" />
// ==========================================================================

import { useEffect } from 'react';

const SITE_NAME = 'HairByTimaBlaq';
const SITE_URL = 'https://hairbytimablaq.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * SEO Component - Updates document head on mount
 * @param {string} title - Page title (will be appended with site name)
 * @param {string} description - Page description
 * @param {string} image - OG image URL (optional)
 * @param {string} url - Canonical URL path (optional, e.g., "/shop")
 * @param {string} type - OG type (default: "website")
 * @param {boolean} noIndex - Set to true to prevent indexing
 */
const SEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  noIndex = false,
}) => {
  useEffect(() => {
    const fullTitle = title 
      ? `${title} | ${SITE_NAME}` 
      : `${SITE_NAME} | Premium Luxury Hair Extensions`;
    const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
    const fullImage = image || DEFAULT_IMAGE;
    const defaultDescription = 'Shop premium 100% human hair extensions. Brazilian, Peruvian, Malaysian bundles, HD lace closures, frontals, and custom wigs. Worldwide shipping.';
    const pageDescription = description || defaultDescription;

    // Update title
    document.title = fullTitle;

    // Helper to update or create meta tag
    const setMeta = (name, content, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Helper to update or create link tag
    const setLink = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Basic meta tags
    setMeta('description', pageDescription);
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    // Canonical URL
    setLink('canonical', fullUrl);

    // Open Graph (works for Instagram, WhatsApp, Snapchat, iMessage, etc.)
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', pageDescription, true);
    setMeta('og:url', fullUrl, true);
    setMeta('og:image', fullImage, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('og:locale', 'en_US', true);

  }, [title, description, image, url, type, noIndex]);

  // This component doesn't render anything
  return null;
};



// ==========================================================================
// SEO Presets for common pages
// ==========================================================================

const SEO_PRESETS = {
  home: {
    title: null,
    description: 'Shop premium 100% human hair extensions. Brazilian, Peruvian, Malaysian bundles, HD lace closures, frontals, and custom wigs. Worldwide shipping to USA, UK, Nigeria.',
  },
  shop: {
    title: 'Shop Hair Extensions',
    description: 'Browse our collection of premium human hair bundles, HD lace closures, frontals, and custom wigs. 100% human hair, worldwide shipping.',
  },
  bundles: {
    title: 'Hair Bundles',
    description: 'Shop premium Brazilian, Peruvian, and Malaysian human hair bundles. Available in straight, body wave, deep wave, and more. 12-30 inches.',
  },
  closures: {
    title: 'HD Lace Closures',
    description: 'Shop HD lace closures in 4x4, 5x5, and 6x6 sizes. Invisible knots, pre-plucked hairline, natural look.',
  },
  frontals: {
    title: 'Lace Frontals',
    description: 'Shop HD lace frontals 13x4 and 13x6. Ear to ear coverage, pre-plucked with baby hairs.',
  },
  wigs: {
    title: 'Human Hair Wigs',
    description: 'Shop full lace and lace front wigs. Custom made with 100% human hair. Pre-styled options available.',
  },
  cart: {
    title: 'Shopping Cart',
    description: 'Review your selected hair products before checkout.',
    noIndex: true,
  },
  checkout: {
    title: 'Checkout',
    description: 'Complete your purchase securely.',
    noIndex: true,
  },
  about: {
    title: 'About Us',
    description: 'Learn about HairByTimaBlaq - your trusted source for premium luxury hair extensions.',
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with HairByTimaBlaq for orders, questions, and custom requests.',
  },
  faq: {
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about our hair products, shipping, returns, and care.',
  },
  hairCare: {
    title: 'Hair Care Guide',
    description: 'Learn how to care for your human hair extensions. Washing, styling, and maintenance tips.',
  },
  wishlist: {
    title: 'My Wishlist',
    description: 'Your saved hair products and favorites.',
    noIndex: true,
  },
  trackOrder: {
    title: 'Track Order',
    description: 'Track your HairByTimaBlaq order status and shipping.',
    noIndex: true,
  },
  myOrders: {
    title: 'My Orders',
    description: 'View your order history.',
    noIndex: true,
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The page you are looking for could not be found.',
    noIndex: true,
  },
};