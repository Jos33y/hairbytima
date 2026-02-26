// =============================================================================
// Admin Categories API - /api/admin/categories
// =============================================================================
// GET: List all categories with product counts
// POST: Create new category
// PUT: Update category
// DELETE: Delete category
// =============================================================================

import { supabase } from './../../_lib/supabase.js';
import { verifyAuth, requireRole } from './../../_lib/auth.js';

export default async function handler(req, res) {
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  switch (req.method) {
    case 'GET':
      return getCategories(req, res);
    case 'POST':
      if (!requireRole(admin, 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return createCategory(req, res);
    case 'PUT':
      if (!requireRole(admin, 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return updateCategory(req, res);
    case 'DELETE':
      if (!requireRole(admin, 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return deleteCategory(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// GET all categories with product counts
async function getCategories(req, res) {
  try {
    // Fetch categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Fetch product counts per category (only non-archived products)
    const { data: productCounts, error: countError } = await supabase
      .from('products')
      .select('category_id')
      .eq('is_archived', false);

    if (countError) throw countError;

    // Count products per category
    const countMap = {};
    (productCounts || []).forEach(p => {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      }
    });

    // Merge counts into categories
    const categoriesWithCounts = (categories || []).map(cat => ({
      ...cat,
      product_count: countMap[cat.id] || 0,
    }));

    return res.status(200).json({
      success: true,
      categories: categoriesWithCounts,
    });

  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

// POST create category
async function createCategory(req, res) {
  try {
    const { name, slug, description, image, sort_order, is_active } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }

    // Get max sort_order for new category
    let newSortOrder = sort_order;
    if (newSortOrder === undefined || newSortOrder === null) {
      const { data: maxSort } = await supabase
        .from('categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
      
      newSortOrder = (maxSort?.sort_order || 0) + 1;
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description: description || null,
        image: image || null,
        sort_order: newSortOrder,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      category: {
        ...category,
        product_count: 0, // New category has no products
      },
    });

  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ error: 'Failed to create category' });
  }
}

// PUT update category
async function updateCategory(req, res) {
  try {
    const { id, name, slug, description, image, sort_order, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    // Check slug uniqueness if changed
    if (slug) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Slug already in use by another category' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description || null;
    if (image !== undefined) updates.image = image || null;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Get product count for this category
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('is_archived', false);

    return res.status(200).json({
      success: true,
      category: {
        ...category,
        product_count: count || 0,
      },
    });

  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ error: 'Failed to update category' });
  }
}

// DELETE category
async function deleteCategory(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    // Check if category has products
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .eq('is_archived', false);

    if (count > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category with ${count} active product${count !== 1 ? 's' : ''}. Move or archive products first.` 
      });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });

  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
}