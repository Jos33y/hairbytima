// =============================================================================
// Admin Products API - /api/admin/products
// =============================================================================
// GET: List all products OR get single product (with ?id=xxx)
// POST: Create new product
// PUT: Update product (with ?id=xxx)
// DELETE: Archive product (with ?id=xxx)
// =============================================================================

import { supabase } from './../../_lib/supabase.js';
import { verifyAuth, requireRole } from './../../_lib/auth.js';

export default async function handler(req, res) {
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  // Check if this is a single product request (has id query param) 
  const { id } = req.query; 

  switch (req.method) {
    case 'GET':
      if (id) {
        return getProduct(req, res, id);
      }
      return getProducts(req, res);
    case 'POST':
      if (!requireRole(admin, 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return createProduct(req, res);
    case 'PUT':
      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }
      if (!requireRole(admin, 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return updateProduct(req, res, id);
    case 'DELETE':
      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }
      if (!requireRole(admin, 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return archiveProduct(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// =============================================================================
// GET all products
// =============================================================================
async function getProducts(req, res) {
  try {
    const { 
      category,
      search,
      in_stock,
      featured,
      archived,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 20 
    } = req.query;

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(id, length, sku, quantity, price_adjustment, is_active)
      `, { count: 'exact' });

    // Filters
    if (category) {
      query = query.eq('category_id', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (in_stock !== undefined) {
      query = query.eq('in_stock', in_stock === 'true');
    }

    if (featured !== undefined) {
      query = query.eq('featured', featured === 'true');
    }

    // Filter by archived status
    if (archived === 'true') {
      query = query.eq('is_archived', true);
    } else if (archived !== 'all') {
      query = query.eq('is_archived', false);
    }

    // Sorting
    const validSortFields = ['name', 'price', 'created_at', 'sort_order'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    query = query.order(sortField, { ascending: order === 'asc' });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      products: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (err) {
    console.error('Get products error:', err.message, err);
    return res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
}

// =============================================================================
// GET single product
// =============================================================================
async function getProduct(req, res, id) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      product,
    });

  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
}

// =============================================================================
// POST create product
// =============================================================================
async function createProduct(req, res) {
  try {
    const {
      name,
      slug,
      category_id,
      description,
      price,
      compare_at_price,
      cost_price,
      image,
      hover_image,
      gallery,
      lengths,
      badge_type,
      badge_text,
      in_stock,
      featured,
      low_stock_threshold,
      weight,
      weight_unit,
      sort_order,
      variants,
    } = req.body;

    // Validation
    if (!name || !slug || !price || !image) {
      return res.status(400).json({ 
        error: 'Name, slug, price, and image are required' 
      });
    }

    // Check slug is unique
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Product with this slug already exists' });
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        category_id,
        description,
        price,
        compare_at_price,
        cost_price,
        image,
        hover_image,
        gallery: gallery || [],
        lengths: lengths || [],
        badge_type,
        badge_text,
        in_stock: in_stock ?? true,
        featured: featured ?? false,
        low_stock_threshold: low_stock_threshold ?? 3,
        weight,
        weight_unit: weight_unit || 'g',
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (productError) throw productError;

    // Create variants if provided
    if (variants && variants.length > 0) {
      const variantData = variants.map(v => ({
        product_id: product.id,
        length: v.length,
        sku: v.sku || `${slug.toUpperCase()}-${v.length.replace('"', '')}`,
        quantity: v.quantity || 0,
        price_adjustment: v.price_adjustment || 0,
        is_active: v.is_active ?? true,
      }));

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantData);

      if (variantError) throw variantError;
    }

    // Fetch complete product with variants
    const { data: completeProduct } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(*)
      `)
      .eq('id', product.id)
      .single();

    return res.status(201).json({
      success: true,
      product: completeProduct,
    });

  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
}

// =============================================================================
// PUT update product
// =============================================================================
async function updateProduct(req, res, id) {
  try {
    const {
      name,
      slug,
      category_id,
      description,
      price,
      compare_at_price,
      cost_price,
      image,
      hover_image,
      gallery,
      lengths,
      badge_type,
      badge_text,
      in_stock,
      featured,
      low_stock_threshold,
      weight,
      weight_unit,
      sort_order,
      is_archived,
      variants,
    } = req.body;

    // Check product exists
    const { data: existing } = await supabase
      .from('products')
      .select('id, slug')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existing.slug) {
      const { data: slugExists } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (slugExists) {
        return res.status(400).json({ error: 'Slug already in use' });
      }
    }

    // Build update object (only include provided fields)
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (category_id !== undefined) updates.category_id = category_id;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;
    if (compare_at_price !== undefined) updates.compare_at_price = compare_at_price;
    if (cost_price !== undefined) updates.cost_price = cost_price;
    if (image !== undefined) updates.image = image;
    if (hover_image !== undefined) updates.hover_image = hover_image;
    if (gallery !== undefined) updates.gallery = gallery;
    if (lengths !== undefined) updates.lengths = lengths;
    if (badge_type !== undefined) updates.badge_type = badge_type;
    if (badge_text !== undefined) updates.badge_text = badge_text;
    if (in_stock !== undefined) updates.in_stock = in_stock;
    if (featured !== undefined) updates.featured = featured;
    if (low_stock_threshold !== undefined) updates.low_stock_threshold = low_stock_threshold;
    if (weight !== undefined) updates.weight = weight;
    if (weight_unit !== undefined) updates.weight_unit = weight_unit;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (is_archived !== undefined) {
      updates.is_archived = is_archived;
      updates.archived_at = is_archived ? new Date().toISOString() : null;
    }

    // Update product
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update variants if provided
    if (variants && Array.isArray(variants)) {
      // Get existing variant IDs
      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('id, length')
        .eq('product_id', id);

      const existingLengths = existingVariants?.map(v => v.length) || [];
      const newLengths = variants.map(v => v.length);

      // Delete removed variants
      const toDelete = existingVariants?.filter(v => !newLengths.includes(v.length)) || [];
      if (toDelete.length > 0) {
        await supabase
          .from('product_variants')
          .delete()
          .in('id', toDelete.map(v => v.id));
      }

      // Upsert variants
      for (const variant of variants) {
        const existingVariant = existingVariants?.find(v => v.length === variant.length);

        if (existingVariant) {
          // Update existing
          await supabase
            .from('product_variants')
            .update({
              sku: variant.sku,
              quantity: variant.quantity,
              price_adjustment: variant.price_adjustment || 0,
              is_active: variant.is_active ?? true,
            })
            .eq('id', existingVariant.id);
        } else {
          // Insert new
          await supabase
            .from('product_variants')
            .insert({
              product_id: id,
              length: variant.length,
              sku: variant.sku || `${slug?.toUpperCase() || 'PROD'}-${variant.length.replace('"', '')}`,
              quantity: variant.quantity || 0,
              price_adjustment: variant.price_adjustment || 0,
              is_active: variant.is_active ?? true,
            });
        }
      }
    }

    // Fetch complete updated product
    const { data: completeProduct } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single();

    return res.status(200).json({
      success: true,
      product: completeProduct,
    });

  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
}

// =============================================================================
// DELETE product (archive or permanent delete)
// =============================================================================
async function archiveProduct(req, res, id) {
  try {
    // Check if product exists and if it's already archived
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('id, is_archived')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check query param for permanent delete
    const { permanent } = req.query;

    // If already archived OR permanent=true, permanently delete
    if (existing.is_archived || permanent === 'true') {
      // Delete variants first (cascade should handle this, but being explicit)
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id);

      // Permanently delete the product
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.status(200).json({
        success: true,
        message: 'Product permanently deleted',
      });
    }

    // Otherwise, just archive it
    const { data: product, error } = await supabase
      .from('products')
      .update({ 
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Product archived',
      product,
    });

  } catch (err) {
    console.error('Delete/Archive product error:', err);
    return res.status(500).json({ error: 'Failed to delete/archive product' });
  }
}