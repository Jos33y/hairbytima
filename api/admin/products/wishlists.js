// =============================================================================
// Admin Products Wishlists API - /api/admin/products/wishlists
// =============================================================================
// GET: Get top wishlisted products from the view
// =============================================================================

import { supabase } from './../../_lib/supabase.js';
import { verifyAuth } from './../../_lib/auth.js';

export default async function handler(req, res) {
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 20 } = req.query;  

    // Fetch from the top_wishlisted_products view
    const { data, error: fetchError } = await supabase
      .from('top_wishlisted_products')
      .select('*')
      .limit(parseInt(limit));

    if (fetchError) {
      console.error('Wishlist fetch error:', fetchError);
      throw fetchError;
    }

    // Get true unique visitor count across ALL wishlisted products
    const { data: uniqueData, error: uniqueError } = await supabase
      .from('wishlists')
      .select('visitor_id');

    let totalUniqueVisitors = 0;
    if (!uniqueError && uniqueData) {
      // Count distinct visitor_ids
      const uniqueVisitorIds = new Set(uniqueData.map(w => w.visitor_id));
      totalUniqueVisitors = uniqueVisitorIds.size;
    }

    // Calculate total saves
    const totalSaves = data?.reduce((sum, p) => sum + (p.wishlist_count || 0), 0) || 0;

    return res.status(200).json({
      success: true,
      products: data || [],
      stats: {
        totalSaves,
        totalUniqueVisitors,
        productsWishlisted: data?.length || 0,
      },
    });

  } catch (err) {
    console.error('Get wishlists error:', err);
    return res.status(500).json({ error: 'Failed to fetch wishlist data' });
  }
}