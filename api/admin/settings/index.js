// =============================================================================
// Admin Settings API - /api/admin/settings
// =============================================================================
// GET: Get all settings or specific key
// PUT: Update settings
// =============================================================================

import { supabase } from './../../_lib/supabase.js';
import { verifyAuth } from './../../_lib/auth.js'; 

export default async function handler(req, res) {
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  const { key } = req.query;

  switch (req.method) {
    case 'GET':
      return getSettings(req, res, key);
    case 'PUT':
      return updateSettings(req, res, admin.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET settings
async function getSettings(req, res, key) {
  try {
    if (key) {
      // Get specific setting
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return res.status(200).json({
        success: true,
        setting: data ? { key: data.key, value: data.value } : null,
      });
    }

    // Get all settings
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .order('key');

    if (error) throw error;

    // Convert to key-value object
    const settings = {};
    (data || []).forEach(s => {
      settings[s.key] = s.value;
    });

    return res.status(200).json({
      success: true,
      settings,
    });

  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

// PUT update settings
async function updateSettings(req, res, adminId) {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    // Upsert each setting
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('store_settings')
        .upsert(update, { onConflict: 'key' });

      if (error) throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
    });

  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
}