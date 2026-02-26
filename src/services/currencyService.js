import { supabase } from './supabase';

const currencyService = {
  /**
   * Get all active exchange rates
   * Returns rates from USD to other currencies
   */
  async getExchangeRates() {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('is_active', true)
      .eq('from_currency', 'USD');

    if (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }

    // Transform to a simple object { USD: 1, EUR: 0.92, ... }
    const rates = { USD: 1 };
    (data || []).forEach(rate => {
      rates[rate.to_currency] = parseFloat(rate.rate);
    });

    return rates;
  },

  /**
   * Get exchange rate for a specific currency
   */
  async getRate(toCurrency) {
    if (toCurrency === 'USD') return 1;

    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', 'USD')
      .eq('to_currency', toCurrency)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error(`Error fetching rate for ${toCurrency}:`, error);
      return null;
    }

    return data ? parseFloat(data.rate) : null;
  },

  /**
   * Get all available currencies (from exchange_rates table)
   */
  async getAvailableCurrencies() {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('to_currency')
      .eq('is_active', true)
      .eq('from_currency', 'USD');

    if (error) {
      console.error('Error fetching available currencies:', error);
      throw error;
    }

    // Always include USD, then add others
    const currencies = ['USD'];
    (data || []).forEach(item => {
      if (!currencies.includes(item.to_currency)) {
        currencies.push(item.to_currency);
      }
    });

    return currencies;
  },
};

