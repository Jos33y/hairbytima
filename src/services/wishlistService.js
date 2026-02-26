// ==========================================================================
// Wishlist Service - Supabase sync for wishlists
// ==========================================================================

import { supabase } from './supabase';

// Generate or get visitor ID from localStorage
const getVisitorId = () => {
  let visitorId = localStorage.getItem('hbt-visitor-id');
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('hbt-visitor-id', visitorId);
  }
  return visitorId;
};

export const wishlistService = {
  /**
   * Get visitor ID
   */
  getVisitorId,

  /**
   * Fetch wishlist items for current visitor
   */
  async getWishlist(visitorId = null) {
    const id = visitorId || getVisitorId();
    
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        product_id,
        added_at,
        product:products(
          id,
          name,
          slug,
          price,
          compare_at_price,
          image,
          in_stock,
          category:categories(id, name, slug)
        )
      `)
      .eq('visitor_id', id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }

    // Transform to flat structure
    return (data || [])
      .filter(item => item.product) // Only items with existing products
      .map(item => ({
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: parseFloat(item.product.price),
        compareAtPrice: item.product.compare_at_price 
          ? parseFloat(item.product.compare_at_price) 
          : null,
        image: item.product.image,
        inStock: item.product.in_stock,
        category: item.product.category,
        addedAt: item.added_at,
      }));
  },

  /**
   * Add product to wishlist
   */
  async addToWishlist(productId) {
    const visitorId = getVisitorId();

    const { data, error } = await supabase
      .from('wishlists')
      .upsert({
        visitor_id: visitorId,
        product_id: productId,
      }, {
        onConflict: 'visitor_id,product_id',
        ignoreDuplicates: true,
      })
      .select()
      .single();

    if (error && error.code !== '23505') { // Ignore duplicate error
      console.error('Error adding to wishlist:', error);
      throw error;
    }

    return data;
  },

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(productId) {
    const visitorId = getVisitorId();

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('visitor_id', visitorId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }

    return true;
  },

  /**
   * Clear entire wishlist
   */
  async clearWishlist() {
    const visitorId = getVisitorId();

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('visitor_id', visitorId);

    if (error) {
      console.error('Error clearing wishlist:', error);
      throw error;
    }

    return true;
  },

  /**
   * Check if product is in wishlist
   */
  async isInWishlist(productId) {
    const visitorId = getVisitorId();

    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('visitor_id', visitorId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking wishlist:', error);
    }

    return !!data;
  },

  /**
   * Get wishlist count for current visitor
   */
  async getWishlistCount() {
    const visitorId = getVisitorId();

    const { count, error } = await supabase
      .from('wishlists')
      .select('id', { count: 'exact', head: true })
      .eq('visitor_id', visitorId);

    if (error) {
      console.error('Error getting wishlist count:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Get shared wishlist by visitor ID (for share feature)
   */
  async getSharedWishlist(visitorId) {
    return this.getWishlist(visitorId);
  },

  /**
   * Sync local wishlist to Supabase (for migration/backup)
   */
  async syncLocalToSupabase(localItems) {
    const visitorId = getVisitorId();

    // Add all local items to Supabase
    const promises = localItems.map(item => 
      supabase
        .from('wishlists')
        .upsert({
          visitor_id: visitorId,
          product_id: item.id,
        }, {
          onConflict: 'visitor_id,product_id',
          ignoreDuplicates: true,
        })
    );

    await Promise.allSettled(promises);
  },
};

