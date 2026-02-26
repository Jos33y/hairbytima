// =============================================================================
// Shipping Service - Calculate shipping rates from Supabase shipping_zones
// =============================================================================

import { supabase } from './supabase';

// List of supported countries (5 Only)
const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', dialCode: '+234' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'GM', name: 'Gambia', dialCode: '+220' },
];

// Cache for shipping zones
let cachedZones = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch shipping zones from Supabase
 * @returns {Promise<Array>} Shipping zones
 */
const fetchShippingZones = async () => {
  const now = Date.now();
  
  // Return cached data if valid
  if (cachedZones && now < cacheExpiry) {
    return cachedZones;
  }

  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    cachedZones = data || [];
    cacheExpiry = now + CACHE_DURATION;
    
    return cachedZones;
  } catch (err) {
    console.error('Fetch shipping zones error:', err);
    return [];
  }
};

/**
 * Find zone for a country code
 * @param {string} countryCode - ISO country code
 * @param {Array} zones - Shipping zones from database
 * @returns {Object|null} Matching zone or null
 */
const findZoneForCountry = (countryCode, zones) => {
  if (!zones || !countryCode) return null;
  
  return zones.find(zone => 
    zone.countries && zone.countries.includes(countryCode)
  );
};

/**
 * Calculate shipping cost
 * @param {string} countryCode - ISO country code
 * @param {number} subtotal - Cart subtotal for free shipping threshold check
 * @param {number} itemCount - Number of items in cart
 * @param {boolean} hasFreeShippingCoupon - If free shipping coupon is applied
 * @returns {Promise<Object>} Shipping info
 */
export const calculateShipping = async (countryCode, subtotal = 0, itemCount = 1, hasFreeShippingCoupon = false) => {
  // Free shipping coupon overrides everything
  if (hasFreeShippingCoupon) {
    return {
      cost: 0,
      isFree: true,
      reason: 'Free shipping coupon applied',
      estimatedDays: null,
      zone: null,
    };
  }

  // Fetch zones from database
  const zones = await fetchShippingZones();
  const zone = findZoneForCountry(countryCode, zones);

  // No zone found - country not supported
  if (!zone) {
    return {
      cost: null,
      isFree: false,
      error: 'Shipping not available to this country. Please contact us.',
      estimatedDays: null,
      zone: null,
    };
  }

  // Check free shipping threshold from database (if set)
  const freeThreshold = parseFloat(zone.free_shipping_threshold) || null;
  if (freeThreshold && subtotal >= freeThreshold) {
    return {
      cost: 0,
      isFree: true,
      reason: `Free shipping on orders over ${freeThreshold}`,
      estimatedDays: formatEstimatedDays(zone),
      zone: zone.name,
    };
  }

  // Calculate shipping cost: base + (per_item * additional items)
  const baseRate = parseFloat(zone.base_rate) || 0;
  const perItemRate = parseFloat(zone.per_item_rate) || 0;
  const cost = baseRate + (perItemRate * Math.max(0, itemCount - 1));

  return {
    cost,
    isFree: cost === 0,
    estimatedDays: formatEstimatedDays(zone),
    zone: zone.name,
    // Include threshold info if exists (for UI "spend X more for free shipping")
    freeThreshold: freeThreshold,
    amountToFree: freeThreshold ? Math.max(0, freeThreshold - subtotal) : null,
  };
};

/**
 * Format estimated days from zone
 * @param {Object} zone - Shipping zone
 * @returns {string|null} Formatted days string
 */
const formatEstimatedDays = (zone) => {
  if (zone.estimated_days_min && zone.estimated_days_max) {
    return `${zone.estimated_days_min}-${zone.estimated_days_max} business days`;
  } else if (zone.estimated_days_min) {
    return `${zone.estimated_days_min}+ business days`;
  }
  return null;
};

/**
 * Get country name from code
 * @param {string} countryCode - ISO country code
 * @returns {string} Country name
 */
const getCountryName = (countryCode) => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country?.name || countryCode;
};

/**
 * Get country by code
 * @param {string} countryCode - ISO country code
 * @returns {Object|null} Country object
 */
const getCountryByCode = (countryCode) => {
  return COUNTRIES.find(c => c.code === countryCode) || null;
};

const shippingService = {
  COUNTRIES,
  fetchShippingZones,
  findZoneForCountry,
  calculateShipping,
  getCountryName,
  getCountryByCode,
};

