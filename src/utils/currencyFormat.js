// ==========================================================================
// Currency Formatting Utilities - src/utils/currencyFormat.js
// ==========================================================================
// Helper functions to format prices in a specific currency
// Used when displaying prices in order's original currency (not global store)
// ==========================================================================

// Currency configuration (same as currencyStore)
export const CURRENCY_CONFIG = {
  USD: { symbol: '$', decimals: 2 },
  GBP: { symbol: '£', decimals: 2 },
  EUR: { symbol: '€', decimals: 2 },
  NGN: { symbol: '₦', decimals: 0 },
  GMD: { symbol: 'D', decimals: 2 },
};

/**
 * Format a USD amount in a specific target currency
 * @param {number} amountInUSD - The price in USD
 * @param {string} targetCurrency - The currency to display (e.g., 'NGN')
 * @param {number} exchangeRate - The exchange rate from USD to target currency
 * @returns {string} Formatted price string with symbol (e.g., '₦1,550,000')
 */
export function formatPriceInCurrency(amountInUSD, targetCurrency, exchangeRate = 1) {
  if (!amountInUSD || isNaN(amountInUSD)) {
    return (CURRENCY_CONFIG[targetCurrency]?.symbol || '$') + '0';
  }
  
  const config = CURRENCY_CONFIG[targetCurrency] || CURRENCY_CONFIG.USD;
  const convertedAmount = parseFloat(amountInUSD) * exchangeRate;
  
  const formatted = convertedAmount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  
  return `${config.symbol}${formatted}`;
}

/**
 * Get raw converted amount (for copying to clipboard)
 * @param {number} amountInUSD - The price in USD
 * @param {string} targetCurrency - The currency code
 * @param {number} exchangeRate - The exchange rate from USD to target currency
 * @returns {string} Plain number string without symbol
 */
export function getConvertedAmount(amountInUSD, targetCurrency, exchangeRate = 1) {
  if (!amountInUSD || isNaN(amountInUSD)) return '0';
  
  const config = CURRENCY_CONFIG[targetCurrency] || CURRENCY_CONFIG.USD;
  const convertedAmount = parseFloat(amountInUSD) * exchangeRate;
  
  // Round based on currency decimals
  if (config.decimals === 0) {
    return Math.round(convertedAmount).toString();
  }
  return convertedAmount.toFixed(config.decimals);
}

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
function getCurrencySymbol(currency) {
  return CURRENCY_CONFIG[currency]?.symbol || currency;
}

