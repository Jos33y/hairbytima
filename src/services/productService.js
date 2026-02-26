import { supabase } from './supabase';

/**
 * Transform product from Supabase snake_case to frontend camelCase
 */
const transformProduct = (product) => {
  if (!product) return null;
  
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: parseFloat(product.price),
    compareAtPrice: product.compare_at_price ? parseFloat(product.compare_at_price) : null,
    costPrice: product.cost_price ? parseFloat(product.cost_price) : null,
    image: product.image,
    hoverImage: product.hover_image,
    gallery: product.gallery || [],
    lengths: product.lengths || [],
    inStock: product.in_stock,
    featured: product.featured,
    lowStockThreshold: product.low_stock_threshold,
    weight: product.weight,
    weightUnit: product.weight_unit,
    sortOrder: product.sort_order,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    } : null,
    variants: (product.variants || []).map(v => ({
      id: v.id,
      length: v.length,
      sku: v.sku,
      quantity: v.quantity,
      priceAdjustment: parseFloat(v.price_adjustment || 0),
      isActive: v.is_active,
    })),
    createdAt: product.created_at,
    badge: product.badge_type ? {
      type: product.badge_type,
      text: product.badge_text || product.badge_type
    } : null,
  };
};

export const productService = {
  /**
   * Get all products with advanced filtering & pagination
   * Used by Shop page
   */
  async getAll(options = {}) {
    const { 
      categorySlug,
      search,
      minPrice,
      maxPrice,
      lengths = [],
      inStock,
      onSale,
      badgeTypes = [],
      limit = 12,
      page = 1,
      sortBy = 'featured',
    } = options;

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(id, length, sku, quantity, price_adjustment, is_active)
      `, { count: 'exact' })
      .eq('is_archived', false);

    // Filter by category slug
    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .single();
      
      if (category) {
        query = query.eq('category_id', category.id);
      } else {
        // Category not found, return empty
        return { products: [], total: 0, page, totalPages: 0 };
      }
    }

    // Search by name or description
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
    }

    // Filter by price range
    if (minPrice !== undefined && minPrice !== null) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      query = query.lte('price', maxPrice);
    }

    // Filter in-stock only
    if (inStock === true) {
      query = query.eq('in_stock', true);
    }

    // Filter on-sale only (has compare_at_price)
    if (onSale === true) {
      query = query.not('compare_at_price', 'is', null);
    }

    // Filter by badge types
    if (badgeTypes.length > 0) {
      query = query.in('badge_type', badgeTypes);
    }

    // NOTE: Length filtering is done client-side due to PostgreSQL array escaping issues
    // The overlaps query fails with quotes in array elements

    // Sorting
    switch (sortBy) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'name-az':
        query = query.order('name', { ascending: true });
        break;
      case 'name-za':
        query = query.order('name', { ascending: false });
        break;
      case 'featured':
      default:
        query = query
          .order('featured', { ascending: false })
          .order('sort_order', { ascending: true });
        break;
    }

    // If length filter is active, we need to fetch all and filter client-side
    // This is because PostgreSQL array overlaps has issues with quote characters
    const hasLengthFilter = lengths.length > 0;
    
    if (!hasLengthFilter) {
      // Normal pagination when no length filter
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }
    // When length filter is active, fetch all matching products

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    // Transform products
    let products = (data || []).map(transformProduct);
    
    // Filter on-sale products properly (compare_at_price > price)
    if (onSale === true) {
      products = products.filter(p => p.compareAtPrice && p.compareAtPrice > p.price);
    }

    // Client-side length filtering
    if (hasLengthFilter) {
      // Create a Set of requested lengths with " suffix for comparison
      const requestedLengths = new Set(lengths.map(l => `${l}"`));
      
      products = products.filter(product => {
        // Check if any product length matches any requested length
        const productLengths = product.lengths || [];
        return productLengths.some(pl => {
          // Normalize the product length (strip backslashes, trim)
          const normalized = String(pl).replace(/\\/g, '').trim();
          return requestedLengths.has(normalized);
        });
      });
    }

    // Calculate totals
    const total = hasLengthFilter ? products.length : (count || 0);
    const totalPages = Math.ceil(total / limit);

    // Apply pagination for length-filtered results
    if (hasLengthFilter) {
      const offset = (page - 1) * limit;
      products = products.slice(offset, offset + limit);
    }

    return {
      products,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  },

  /**
   * Get featured/bestseller products
   */
  async getFeatured(limit = 4) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(id, length, sku, quantity, price_adjustment, is_active)
      `)
      .eq('is_archived', false)
      .eq('featured', true)
      .eq('in_stock', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }

    return (data || []).map(transformProduct);
  },

  /**
   * Get new arrivals (most recently added)
   */
  async getNewArrivals(limit = 4) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(id, length, sku, quantity, price_adjustment, is_active)
      `)
      .eq('is_archived', false)
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching new arrivals:', error);
      throw error;
    }

    return (data || []).map(transformProduct);
  },

  /**
   * Get products on sale (has compare_at_price > price)
   */
  async getOnSale(limit = 8) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(id, length, sku, quantity, price_adjustment, is_active)
      `)
      .eq('is_archived', false)
      .eq('in_stock', true)
      .not('compare_at_price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sale products:', error);
      throw error;
    }

    return (data || [])
      .filter(p => p.compare_at_price && parseFloat(p.compare_at_price) > parseFloat(p.price))
      .map(transformProduct);
  },

  /**
   * Get products by category ID
   */
  async getByCategory(categoryId, limit) {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(id, length, sku, quantity, price_adjustment, is_active)
      `)
      .eq('is_archived', false)
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }

    return (data || []).map(transformProduct);
  },

  /**
   * Get single product by slug
   */
  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(id, length, sku, quantity, price_adjustment, is_active)
      `)
      .eq('slug', slug)
      .eq('is_archived', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching product:', error);
      throw error;
    }

    return transformProduct(data);
  },

  /**
   * Get single product by ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(id, length, sku, quantity, price_adjustment, is_active)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching product:', error);
      throw error;
    }

    return transformProduct(data);
  },

  /**
   * Search products by name or description (for SearchModal)
   */
  async search(query, limit = 10) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, image, price, compare_at_price, 
        badge_type, badge_text, in_stock,
        category:categories(id, name, slug)
      `)
      .eq('is_archived', false)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('featured', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return (data || []).map(transformProduct);
  },

  /**
   * Get all unique lengths from products (for filter options)
   * Returns just numbers (e.g., ['10', '14', '16', '18'])
   */
  async getAvailableLengths() {
    const { data, error } = await supabase
      .from('products')
      .select('lengths')
      .eq('is_archived', false);

    if (error) {
      console.error('Error fetching lengths:', error);
      throw error;
    }

    // Flatten, dedupe, and extract just numbers
    const allLengths = (data || [])
      .flatMap(p => p.lengths || [])
      .filter(Boolean)
      .map(l => {
        // Strip all quote variations: ' " ″ " " and backslashes
        return String(l)
          .replace(/\\/g, '')     // backslash
          .replace(/'/g, '')      // single quote
          .replace(/"/g, '')      // double quote
          .replace(/\u2033/g, '') // double prime ″
          .replace(/\u201C/g, '') // left double quote "
          .replace(/\u201D/g, '') // right double quote "
          .trim();
      })
      .filter(l => l); // Remove empty strings
    
    const uniqueLengths = [...new Set(allLengths)];
    
    // Sort lengths numerically (10, 14, 18, etc.)
    return uniqueLengths.sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
  },

  /**
   * Get price range (min/max) from products
   */
  async getPriceRange(categorySlug = null) {
    let query = supabase
      .from('products')
      .select('price')
      .eq('is_archived', false);

    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .single();
      
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching price range:', error);
      throw error;
    }

    const prices = (data || []).map(p => parseFloat(p.price));
    
    if (prices.length === 0) {
      return { min: 0, max: 1000 };
    }

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  },

  /**
   * Get product count
   */
  async getCount(categoryId = null) {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', false);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting products:', error);
      throw error;
    }

    return count || 0;
  },
};

