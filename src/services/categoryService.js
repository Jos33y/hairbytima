import { supabase } from './supabase';

/**
 * Transform category from Supabase snake_case to frontend camelCase
 */
const transformCategory = (category) => {
  if (!category) return null;
  
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    sortOrder: category.sort_order,
    productCount: category.product_count || 0,
    isActive: category.is_active,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  };
};

export const categoryService = {
  /**
   * Get all active categories
   */
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return (data || []).map(transformCategory);
  },

  /**
   * Get category by slug
   */
  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching category:', error);
      throw error;
    }

    return transformCategory(data);
  },

  /**
   * Get category by ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching category:', error);
      throw error;
    }

    return transformCategory(data);
  },

  /**
   * Get categories with product counts (for shop sidebar/filters)
   */
  async getWithCounts() {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories with counts:', error);
      throw error;
    }

    return (data || []).map(cat => ({
      ...transformCategory(cat),
      productCount: cat.products?.[0]?.count || 0,
    }));
  },

  /**
   * Get all categories with product counts (alias for homepage)
   * Returns raw format with product_count for backward compatibility
   */
  async getAllWithProductCounts() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    // Return raw data with product_count field (not transformed)
    // This is used by CategoriesSection which expects snake_case
    return data || [];
  },
};

