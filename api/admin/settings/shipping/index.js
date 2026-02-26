// =============================================================================
// Admin Shipping Zones API - /api/admin/settings/shipping
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
      return getShippingZones(req, res);
    case 'POST':
      return createShippingZone(req, res);
    case 'PUT':
      if (!id) return res.status(400).json({ error: 'ID required' });
      return updateShippingZone(req, res, id);
    case 'DELETE':
      if (!id) return res.status(400).json({ error: 'ID required' });
      return deleteShippingZone(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getShippingZones(req, res) {
  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const zones = (data || []).map(z => ({
      id: z.id,
      name: z.name,
      countries: z.countries || [],
      baseRate: parseFloat(z.base_rate) || 0,
      perItemRate: parseFloat(z.per_item_rate) || 0,
      freeShippingThreshold: z.free_shipping_threshold ? parseFloat(z.free_shipping_threshold) : null,
      estimatedDaysMin: z.estimated_days_min,
      estimatedDaysMax: z.estimated_days_max,
      isActive: z.is_active,
      sortOrder: z.sort_order,
    }));

    return res.status(200).json({ success: true, zones });
  } catch (err) {
    console.error('Get shipping zones error:', err);
    return res.status(500).json({ error: 'Failed to fetch shipping zones' });
  }
}

async function createShippingZone(req, res) {
  try {
    const { name, countries, baseRate, perItemRate, freeShippingThreshold, estimatedDaysMin, estimatedDaysMax, isActive, sortOrder } = req.body;

    if (!name || !countries || !Array.isArray(countries)) {
      return res.status(400).json({ error: 'Name and countries array are required' });
    }

    const { data, error } = await supabase
      .from('shipping_zones')
      .insert({
        name,
        countries,
        base_rate: parseFloat(baseRate) || 0,
        per_item_rate: parseFloat(perItemRate) || 0,
        free_shipping_threshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
        estimated_days_min: estimatedDaysMin || null,
        estimated_days_max: estimatedDaysMax || null,
        is_active: isActive !== false,
        sort_order: sortOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      zone: {
        id: data.id,
        name: data.name,
        countries: data.countries,
        baseRate: parseFloat(data.base_rate),
        perItemRate: parseFloat(data.per_item_rate),
        freeShippingThreshold: data.free_shipping_threshold ? parseFloat(data.free_shipping_threshold) : null,
        estimatedDaysMin: data.estimated_days_min,
        estimatedDaysMax: data.estimated_days_max,
        isActive: data.is_active,
        sortOrder: data.sort_order,
      },
    });
  } catch (err) {
    console.error('Create shipping zone error:', err);
    return res.status(500).json({ error: 'Failed to create shipping zone' });
  }
}

async function updateShippingZone(req, res, id) {
  try {
    const updates = {};
    const { name, countries, baseRate, perItemRate, freeShippingThreshold, estimatedDaysMin, estimatedDaysMax, isActive, sortOrder } = req.body;

    if (name !== undefined) updates.name = name;
    if (countries !== undefined) updates.countries = countries;
    if (baseRate !== undefined) updates.base_rate = parseFloat(baseRate);
    if (perItemRate !== undefined) updates.per_item_rate = parseFloat(perItemRate);
    if (freeShippingThreshold !== undefined) updates.free_shipping_threshold = freeShippingThreshold ? parseFloat(freeShippingThreshold) : null;
    if (estimatedDaysMin !== undefined) updates.estimated_days_min = estimatedDaysMin;
    if (estimatedDaysMax !== undefined) updates.estimated_days_max = estimatedDaysMax;
    if (isActive !== undefined) updates.is_active = isActive;
    if (sortOrder !== undefined) updates.sort_order = sortOrder;

    const { data, error } = await supabase
      .from('shipping_zones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      zone: {
        id: data.id,
        name: data.name,
        countries: data.countries,
        baseRate: parseFloat(data.base_rate) || 0,
        perItemRate: parseFloat(data.per_item_rate) || 0,
        freeShippingThreshold: data.free_shipping_threshold ? parseFloat(data.free_shipping_threshold) : null,
        estimatedDaysMin: data.estimated_days_min,
        estimatedDaysMax: data.estimated_days_max,
        isActive: data.is_active,
        sortOrder: data.sort_order,
      },
    });
  } catch (err) {
    console.error('Update shipping zone error:', err);
    return res.status(500).json({ error: 'Failed to update shipping zone' });
  }
}

async function deleteShippingZone(req, res, id) {
  try {
    const { error } = await supabase
      .from('shipping_zones')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Shipping zone deleted' });
  } catch (err) {
    console.error('Delete shipping zone error:', err);
    return res.status(500).json({ error: 'Failed to delete shipping zone' });
  }
}