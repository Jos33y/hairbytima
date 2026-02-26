// =============================================================================
// Admin Exchange Rates API - /api/admin/settings/currency
// =============================================================================

import { supabase } from './../../../_lib/supabase.js';
import { verifyAuth } from './../../../_lib/auth.js';

export default async function handler(req, res) {
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      return getExchangeRates(req, res);
    case 'POST':
      return createExchangeRate(req, res, admin.id);
    case 'PUT':
      if (!id) return res.status(400).json({ error: 'ID required' });
      return updateExchangeRate(req, res, id, admin.id);
    case 'DELETE':
      if (!id) return res.status(400).json({ error: 'ID required' });
      return deleteExchangeRate(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getExchangeRates(req, res) {
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('to_currency');

    if (error) throw error;

    const rates = (data || []).map(r => ({
      id: r.id,
      fromCurrency: r.from_currency,
      toCurrency: r.to_currency,
      rate: parseFloat(r.rate),
      isActive: r.is_active,
      updatedAt: r.updated_at,
    }));

    return res.status(200).json({ success: true, rates });
  } catch (err) {
    console.error('Get exchange rates error:', err);
    return res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
}

async function createExchangeRate(req, res, adminId) {
  try {
    const { fromCurrency = 'USD', toCurrency, rate, isActive } = req.body;

    if (!toCurrency || !rate) {
      return res.status(400).json({ error: 'Target currency and rate are required' });
    }

    const { data, error } = await supabase
      .from('exchange_rates')
      .insert({
        from_currency: fromCurrency.toUpperCase(),
        to_currency: toCurrency.toUpperCase(),
        rate: parseFloat(rate),
        is_active: isActive !== false,
        last_updated_by: adminId,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      rate: {
        id: data.id,
        fromCurrency: data.from_currency,
        toCurrency: data.to_currency,
        rate: parseFloat(data.rate),
        isActive: data.is_active,
      },
    });
  } catch (err) {
    console.error('Create exchange rate error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Exchange rate for this currency pair already exists' });
    }
    return res.status(500).json({ error: 'Failed to create exchange rate' });
  }
}

async function updateExchangeRate(req, res, id, adminId) {
  try {
    const updates = { last_updated_by: adminId };
    const { fromCurrency, toCurrency, rate, isActive } = req.body;

    if (fromCurrency !== undefined) updates.from_currency = fromCurrency.toUpperCase();
    if (toCurrency !== undefined) updates.to_currency = toCurrency.toUpperCase();
    if (rate !== undefined) updates.rate = parseFloat(rate);
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from('exchange_rates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      rate: {
        id: data.id,
        fromCurrency: data.from_currency,
        toCurrency: data.to_currency,
        rate: parseFloat(data.rate),
        isActive: data.is_active,
      },
    });
  } catch (err) {
    console.error('Update exchange rate error:', err);
    return res.status(500).json({ error: 'Failed to update exchange rate' });
  }
}

async function deleteExchangeRate(req, res, id) {
  try {
    const { error } = await supabase
      .from('exchange_rates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Exchange rate deleted' });
  } catch (err) {
    console.error('Delete exchange rate error:', err);
    return res.status(500).json({ error: 'Failed to delete exchange rate' });
  }
}