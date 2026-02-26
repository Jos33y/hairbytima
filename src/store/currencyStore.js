import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabase';

// Currency configuration with symbols
export const CURRENCY_CONFIG = {
  USD: { 
    symbol: '$', 
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2
  },
  GBP: { 
    symbol: '£', 
    name: 'British Pound',
    locale: 'en-GB',
    decimals: 2
  },
  EUR: { 
    symbol: '€', 
    name: 'Euro',
    locale: 'de-DE',
    decimals: 2
  },
  NGN: { 
    symbol: '₦', 
    name: 'Nigerian Naira',
    locale: 'en-NG',
    decimals: 0
  },
  GMD: { 
    symbol: 'D', 
    name: 'Gambian Dalasi',
    locale: 'en-GM',
    decimals: 2
  },
};

// Map countries to currencies (your 5 target markets)
const COUNTRY_CURRENCY_MAP = {
  // United States
  US: 'USD',
  
  // United Kingdom
  GB: 'GBP',
  UK: 'GBP',
  
  // European countries (Portugal + others using EUR)
  PT: 'EUR', // Portugal
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  
  // Nigeria
  NG: 'NGN',
  
  // Gambia
  GM: 'GMD',
};

// Default fallback rates (used if backend fails)
const DEFAULT_RATES = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  NGN: 1550,
  GMD: 70,
};

// Helper functions (exported for use without hooks)
export const getCurrencySymbol = (currency) => {
  return CURRENCY_CONFIG[currency]?.symbol || currency;
};

export const getCurrencyName = (currency) => {
  return CURRENCY_CONFIG[currency]?.name || currency;
};

// ==========================================================================
// Detect user's country via IP geolocation
// ==========================================================================
async function detectUserCountry() {
  try {
    // Try multiple free geolocation APIs with fallbacks
    const apis = [
      {
        url: 'https://ipapi.co/json/',
        getCountry: (data) => data.country_code,
      },
      {
        url: 'https://ip-api.com/json/?fields=countryCode',
        getCountry: (data) => data.countryCode,
      },
    ];

    for (const api of apis) {
      try {
        const response = await fetch(api.url, { 
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          const countryCode = api.getCountry(data);
          
          if (countryCode) {
            console.log(`🌍 Detected country: ${countryCode}`);
            return countryCode.toUpperCase();
          }
        }
      } catch (err) {
        // Try next API
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Country detection failed:', error);
    return null;
  }
}

// Get currency for a country code
function getCurrencyForCountry(countryCode) {
  if (!countryCode) return 'USD';
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] || 'USD';
}

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      // State
      currency: 'USD',
      exchangeRates: DEFAULT_RATES,
      availableCurrencies: ['USD'],
      isLoading: false,
      lastFetched: null,
      error: null,
      detectedCountry: null,
      hasManuallySelected: false, // Track if user manually changed currency

      // Initialize - fetch rates and auto-detect location
      initialize: async () => {
        const state = get();
        
        // Skip if already fetched recently (within 5 minutes)
        if (state.lastFetched && Date.now() - state.lastFetched < 5 * 60 * 1000) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Fetch exchange rates from Supabase
          const { data, error } = await supabase
            .from('exchange_rates')
            .select('to_currency, rate')
            .eq('is_active', true)
            .eq('from_currency', 'USD');

          if (error) throw error;

          // Build rates object
          const rates = { USD: 1 };
          const currencies = ['USD'];

          (data || []).forEach(item => {
            rates[item.to_currency] = parseFloat(item.rate);
            if (!currencies.includes(item.to_currency)) {
              currencies.push(item.to_currency);
            }
          });

          // Sort currencies in preferred order
          const preferredOrder = ['USD', 'GBP', 'EUR', 'NGN', 'GMD'];
          currencies.sort((a, b) => {
            const indexA = preferredOrder.indexOf(a);
            const indexB = preferredOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });

          set({ 
            exchangeRates: rates,
            availableCurrencies: currencies,
            isLoading: false,
            lastFetched: Date.now(),
          });

          // Auto-detect country and set currency (only if user hasn't manually selected)
          const currentState = get();
          if (!currentState.hasManuallySelected && !currentState.detectedCountry) {
            const countryCode = await detectUserCountry();
            
            if (countryCode) {
              const suggestedCurrency = getCurrencyForCountry(countryCode);
              
              // Only auto-set if the currency is available
              if (currencies.includes(suggestedCurrency)) {
                set({ 
                  currency: suggestedCurrency,
                  detectedCountry: countryCode,
                });
                console.log(`💱 Auto-set currency to ${suggestedCurrency} for ${countryCode}`);
              } else {
                set({ detectedCountry: countryCode });
              }
            }
          }

          // If current currency is no longer available, switch to USD
          if (!currencies.includes(get().currency)) {
            set({ currency: 'USD' });
          }

        } catch (error) {
          console.error('Failed to fetch exchange rates:', error);
          set({ 
            isLoading: false, 
            error: error.message,
            exchangeRates: DEFAULT_RATES,
            availableCurrencies: Object.keys(DEFAULT_RATES),
          });
        }
      },

      // Set currency (marks as manually selected)
      setCurrency: (currency) => {
        const { availableCurrencies } = get();
        if (availableCurrencies.includes(currency)) {
          set({ 
            currency,
            hasManuallySelected: true, // User explicitly chose this
          });
        }
      },

      // Get exchange rate for current currency
      getExchangeRate: () => {
        const { currency, exchangeRates } = get();
        return exchangeRates[currency] || 1;
      },

      // Convert price from USD to current currency
      convertPrice: (priceInUSD) => {
        if (!priceInUSD || isNaN(priceInUSD)) return 0;
        const { currency, exchangeRates } = get();
        const rate = exchangeRates[currency] || 1;
        return priceInUSD * rate;
      },

      // Format price with currency symbol
      formatPrice: (priceInUSD) => {
        if (!priceInUSD || isNaN(priceInUSD)) return getCurrencySymbol(get().currency) + '0';
        
        const { currency, exchangeRates } = get();
        const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
        const rate = exchangeRates[currency] || 1;
        const convertedPrice = priceInUSD * rate;
        
        return `${config.symbol}${convertedPrice.toLocaleString(config.locale, { 
          minimumFractionDigits: config.decimals, 
          maximumFractionDigits: config.decimals 
        })}`;
      },

      // Format price with currency code (for invoices, etc.)
      formatPriceWithCode: (priceInUSD) => {
        if (!priceInUSD || isNaN(priceInUSD)) return '0 ' + get().currency;
        
        const { currency, exchangeRates } = get();
        const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
        const rate = exchangeRates[currency] || 1;
        const convertedPrice = priceInUSD * rate;
        
        return `${convertedPrice.toLocaleString(config.locale, { 
          minimumFractionDigits: config.decimals, 
          maximumFractionDigits: config.decimals 
        })} ${currency}`;
      },

      // Get current currency info
      getCurrencyInfo: () => {
        const { currency } = get();
        return {
          code: currency,
          ...CURRENCY_CONFIG[currency],
        };
      },

      // Force refresh rates
      refreshRates: async () => {
        set({ lastFetched: null });
        await get().initialize();
      },

      // Reset to auto-detected currency
      resetToDetected: () => {
        const { detectedCountry, availableCurrencies } = get();
        const suggestedCurrency = getCurrencyForCountry(detectedCountry);
        
        if (availableCurrencies.includes(suggestedCurrency)) {
          set({ 
            currency: suggestedCurrency,
            hasManuallySelected: false,
          });
        }
      },
    }),
    {
      name: 'hbt-currency',
      partialize: (state) => ({ 
        currency: state.currency,
        hasManuallySelected: state.hasManuallySelected,
        detectedCountry: state.detectedCountry,
      }),
    }
  )
);