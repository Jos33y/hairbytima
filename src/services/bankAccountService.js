import { supabase } from './supabase';

const bankAccountService = {
  async getAll() {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data;
  },

  async getByCurrency(currency) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('currency', currency.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};

