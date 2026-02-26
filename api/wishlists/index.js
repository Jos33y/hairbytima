// =============================================================================
// Public Wishlists API - /api/wishlists
// =============================================================================
// GET: Get wishlist items for a visitor
// POST: Add item to wishlist
// DELETE: Remove item from wishlist
// =============================================================================

import { supabase } from './../_lib/supabase.js';

export default async function handler(req, res) {
  // Get visitor ID from header or query
  const visitorId = req.headers['x-visitor-id'] || req.query.visitor_id;

  if (!visitorId) {
    return res.status(400).json({ error: 'Visitor ID is required' });
  }

  switch (req.method) {
    case 'GET':
      return getWishlist(req, res, visitorId);
    case 'POST':
      return addToWishlist(req, res, visitorId);
    case 'DELETE':
      return removeFromWishlist(req, res, visitorId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET wishlist items for a visitor
async function getWishlist(req, res, visitorId) {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        added_at,
        product:products(
          id,
          name,
          slug,
          price,
          compare_at_price,
          image,
          in_stock,
          category:categories(name, slug)
        )
      `)
      .eq('visitor_id', visitorId)
      .order('added_at', { ascending: false });

    if (error) throw error;

    // Filter out any null products (deleted products)
    const items = (data || []).filter(item => item.product !== null);

    return res.status(200).json({
      success: true,
      items,
      count: items.length,
    });

  } catch (err) {
    console.error('Get wishlist error:', err);
    return res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
}

// POST add item to wishlist
async function addToWishlist(req, res, visitorId) {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', product_id)
      .eq('is_archived', false)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add to wishlist (upsert to handle duplicates)
    const { data, error } = await supabase
      .from('wishlists')
      .upsert(
        { visitor_id: visitorId, product_id },
        { onConflict: 'visitor_id,product_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Added to wishlist',
      item: data,
    });

  } catch (err) {
    console.error('Add to wishlist error:', err);
    return res.status(500).json({ error: 'Failed to add to wishlist' });
  }
}

// DELETE remove item from wishlist
async function removeFromWishlist(req, res, visitorId) {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('visitor_id', visitorId)
      .eq('product_id', product_id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Removed from wishlist',
    });

  } catch (err) {
    console.error('Remove from wishlist error:', err);
    return res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
}