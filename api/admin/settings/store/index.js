// =============================================================================
// Admin Store Settings API - /api/admin/settings/store
// =============================================================================
// Handles store-wide settings like currency display preferences
// Stores settings in the store_settings table as key-value pairs (JSONB value)

import { supabase } from './../../../_lib/supabase.js';
import { verifyAuth } from './../../../_lib/auth.js';

// Settings keys that can be stored
const ALLOWED_SETTINGS = [
  'baseCurrency',
  'defaultCustomerCurrency',
  'currencyPosition',
  'storeName',
  'storeEmail',
  'storePhone',
  'storeAddress',
  'socialInstagram',
  'socialTiktok',
  'socialSnapchat',
  'socialWhatsapp',
];

export default async function handler(req, res) {
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  switch (req.method) {
    case 'GET':
      return getStoreSettings(req, res);
    case 'PUT':
      return updateStoreSettings(req, res, admin.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Get all store settings
 */
async function getStoreSettings(req, res) {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('key, value')
      .order('key');

    if (error) throw error;

    // Convert array of {key, value} to object
    // Value is JSONB, so extract the actual value
    const settings = {};
    (data || []).forEach(item => {
      // JSONB value - could be string, number, object, etc.
      settings[item.key] = item.value;
    });

    // Add defaults for missing settings
    const defaults = {
      baseCurrency: 'USD',
      defaultCustomerCurrency: 'USD',
      currencyPosition: 'before',
    };

    return res.status(200).json({
      success: true,
      settings: { ...defaults, ...settings },
    });
  } catch (err) {
    console.error('Get store settings error:', err);
    return res.status(500).json({ error: 'Failed to fetch store settings' });
  }
}

/**
 * Update store settings (upsert)
 */
async function updateStoreSettings(req, res, adminId) {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data' });
    }

    // Filter to only allowed settings
    const validUpdates = Object.entries(updates).filter(
      ([key]) => ALLOWED_SETTINGS.includes(key)
    );

    if (validUpdates.length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' });
    }

    // Upsert each setting
    // Value column is JSONB, so we store the value directly (not stringified)
    const upsertPromises = validUpdates.map(([key, value]) => {
      return supabase
        .from('store_settings')
        .upsert(
          {
            key,
            value: value, // JSONB column accepts any JSON-serializable value
            updated_by: adminId,
          },
          { onConflict: 'key' }
        );
    });

    const results = await Promise.all(upsertPromises);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Some settings failed to save:', errors);
      throw new Error('Failed to save some settings');
    }

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      updated: validUpdates.map(([key]) => key),
    });
  } catch (err) {
    console.error('Update store settings error:', err);
    return res.status(500).json({ error: 'Failed to update store settings' });
  }
}