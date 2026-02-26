// =============================================================================
// Admin Store Assets Upload API - /api/admin/settings/upload
// =============================================================================
// POST: Upload store assets (logo, banners, etc.)
// DELETE: Remove store asset
// =============================================================================

import { supabase } from './../../../_lib/supabase.js';
import { verifyAuth } from './../../../_lib/auth.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default async function handler(req, res) {
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  switch (req.method) {
    case 'POST':
      return uploadAsset(req, res);
    case 'DELETE':
      return deleteAsset(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// POST upload asset
async function uploadAsset(req, res) {
  try {
    const { file, fileName, assetType = 'logo' } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Validate asset type
    const validTypes = ['logo', 'favicon', 'banner', 'og-image'];
    if (!validTypes.includes(assetType)) {
      return res.status(400).json({ error: 'Invalid asset type' });
    }

    // Extract base64 data
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine file extension from base64 header
    let extension = 'png';
    if (file.startsWith('data:image/jpeg')) extension = 'jpg';
    else if (file.startsWith('data:image/webp')) extension = 'webp';
    else if (file.startsWith('data:image/gif')) extension = 'gif';
    else if (file.startsWith('data:image/svg')) extension = 'svg';

    // Generate file path: store/{assetType}.{ext}
    const filePath = `store/${assetType}.${extension}`;

    // Delete existing file if exists (to replace)
    await supabase.storage
      .from('images')
      .remove([filePath]);

    // Upload new file
    const { data, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // Add cache buster
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Save URL to store_settings
    const settingKey = `store_${assetType}`;
    await supabase
      .from('store_settings')
      .upsert({
        key: settingKey,
        value: { url: publicUrl, path: filePath, updatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    return res.status(200).json({
      success: true,
      url: publicUrl,
      path: filePath,
    });

  } catch (err) {
    console.error('Upload asset error:', err);
    return res.status(500).json({ error: 'Failed to upload asset', details: err.message });
  }
}

// DELETE remove asset
async function deleteAsset(req, res) {
  try {
    const { assetType = 'logo' } = req.query;

    // Get current asset path from settings
    const { data: setting } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', `store_${assetType}`)
      .single();

    if (setting?.value?.path) {
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('images')
        .remove([setting.value.path]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
      }
    }

    // Remove from settings
    await supabase
      .from('store_settings')
      .delete()
      .eq('key', `store_${assetType}`);

    return res.status(200).json({
      success: true,
      message: 'Asset deleted successfully',
    });

  } catch (err) {
    console.error('Delete asset error:', err);
    return res.status(500).json({ error: 'Failed to delete asset', details: err.message });
  }
}