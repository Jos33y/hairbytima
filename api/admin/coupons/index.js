// =============================================================================
// Admin Coupons API - /api/admin/coupons
// =============================================================================
// GET: List all coupons with usage stats
// POST: Create new coupon
// PUT: Update coupon
// DELETE: Delete coupon
// =============================================================================

import { supabase } from './../../_lib/supabase.js';
import { verifyAuth } from './../../_lib/auth.js';

export default async function handler(req, res) {
  // Verify admin is authenticated
  const { admin, error, status } = await verifyAuth(req);
  if (error) {
    return res.status(status).json({ error });
  }

  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      if (id) {
        return getCoupon(req, res, id);
      }
      return getCoupons(req, res);
    case 'POST':
      return createCoupon(req, res);
    case 'PUT':
      if (!id) {
        return res.status(400).json({ error: 'Coupon ID is required' });
      }
      return updateCoupon(req, res, id);
    case 'DELETE':
      if (!id) {
        return res.status(400).json({ error: 'Coupon ID is required' });
      }
      return deleteCoupon(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// =============================================================================
// GET all coupons
// =============================================================================
async function getCoupons(req, res) {
  try {
    const { status: filterStatus, search } = req.query;

    // Get all coupons
    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    // Search filter
    if (search) {
      query = query.ilike('code', `%${search}%`);
    }

    const { data: coupons, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    // If no coupons, return empty
    if (!coupons || coupons.length === 0) {
      return res.status(200).json({
        success: true,
        coupons: [],
        stats: {
          total: 0,
          active: 0,
          totalUses: 0,
          totalRevenue: 0,
          totalDiscount: 0,
        },
      });
    }

    // Get usage history for each coupon from coupon_usage table
    const couponIds = coupons.map(c => c.id);
    const { data: usageData, error: usageError } = await supabase
      .from('coupon_usage')
      .select('*')
      .in('coupon_id', couponIds)
      .order('used_at', { ascending: false });

    if (usageError) throw usageError;

    // Also get usage from orders table (fallback for orders before coupon_usage was populated)
    const couponCodes = coupons.map(c => c.code);
    const { data: ordersWithCoupons, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, total, discount, coupon_code, coupon_id, created_at')
      .in('coupon_code', couponCodes)
      .order('created_at', { ascending: false });

    if (ordersError) console.error('Orders fallback error:', ordersError);

    // Format response
    const now = new Date();
    const formattedCoupons = coupons.map(coupon => {
      // Get usage from coupon_usage table
      const usageFromTable = usageData?.filter(u => u.coupon_id === coupon.id) || [];
      
      // Get usage from orders table (fallback)
      const usageFromOrders = ordersWithCoupons?.filter(o => 
        o.coupon_code === coupon.code || o.coupon_id === coupon.id
      ) || [];
      
      // Merge: prefer coupon_usage data, add orders data if not already tracked
      const trackedOrderIds = new Set(usageFromTable.map(u => u.order_id));
      const additionalUsage = usageFromOrders
        .filter(o => !trackedOrderIds.has(o.id))
        .map(o => ({
          customer_email: o.customer_email,
          order_id: o.id,
          order_total: parseFloat(o.total) || 0,
          discount_amount: parseFloat(o.discount) || 0,
          used_at: o.created_at,
        }));
      
      const allUsage = [...usageFromTable, ...additionalUsage];
      
      return {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
        minOrderValue: parseFloat(coupon.min_order_value) || 0,
        maxDiscount: coupon.max_discount ? parseFloat(coupon.max_discount) : null,
        maxUses: coupon.max_uses,
        currentUses: coupon.current_uses || allUsage.length || 0,
        isSingleUse: coupon.is_single_use,
        startsAt: coupon.starts_at,
        expiresAt: coupon.expires_at,
        isActive: coupon.is_active,
        createdAt: coupon.created_at,
        // Analytics
        totalRevenue: parseFloat(coupon.total_revenue_generated) || allUsage.reduce((sum, u) => sum + parseFloat(u.order_total || 0), 0),
        totalDiscount: parseFloat(coupon.total_discount_given) || allUsage.reduce((sum, u) => sum + parseFloat(u.discount_amount || 0), 0),
        averageOrderValue: allUsage.length > 0 
          ? allUsage.reduce((sum, u) => sum + parseFloat(u.order_total || 0), 0) / allUsage.length 
          : 0,
        usageHistory: allUsage.slice(0, 10).map(u => ({
          customer: u.customer_email?.split('@')[0] || 'Customer',
          email: u.customer_email || '',
          orderId: u.order_id || null,
          orderTotal: parseFloat(u.order_total) || 0,
          discount: parseFloat(u.discount_amount) || 0,
          usedAt: u.used_at,
        })),
      };
    });

    // Apply status filter
    let filteredCoupons = formattedCoupons;
    if (filterStatus === 'active') {
      filteredCoupons = formattedCoupons.filter(c => 
        c.isActive && (!c.expiresAt || new Date(c.expiresAt) > now)
      );
    } else if (filterStatus === 'inactive') {
      filteredCoupons = formattedCoupons.filter(c => !c.isActive);
    } else if (filterStatus === 'expired') {
      filteredCoupons = formattedCoupons.filter(c => 
        c.expiresAt && new Date(c.expiresAt) < now
      );
    }

    // Calculate stats
    const stats = {
      total: coupons.length,
      active: formattedCoupons.filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > now)).length,
      totalUses: formattedCoupons.reduce((sum, c) => sum + c.currentUses, 0),
      totalRevenue: formattedCoupons.reduce((sum, c) => sum + c.totalRevenue, 0),
      totalDiscount: formattedCoupons.reduce((sum, c) => sum + c.totalDiscount, 0),
    };

    return res.status(200).json({
      success: true,
      coupons: filteredCoupons,
      stats,
    });

  } catch (err) {
    console.error('Get coupons error:', err);
    return res.status(500).json({ error: 'Failed to fetch coupons', details: err.message });
  }
}

// =============================================================================
// GET single coupon with full usage history
// =============================================================================
async function getCoupon(req, res, id) {
  try {
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Get usage from coupon_usage table
    const { data: usageData, error: usageError } = await supabase
      .from('coupon_usage')
      .select('*')
      .eq('coupon_id', id)
      .order('used_at', { ascending: false });

    if (usageError) throw usageError;

    // Get usage from orders table (fallback)
    const { data: ordersWithCoupon, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, total, discount, coupon_code, coupon_id, created_at')
      .or(`coupon_code.eq.${coupon.code},coupon_id.eq.${id}`)
      .order('created_at', { ascending: false });

    if (ordersError) console.error('Orders fallback error:', ordersError);

    // Merge: prefer coupon_usage data, add orders data if not already tracked
    const trackedOrderIds = new Set((usageData || []).map(u => u.order_id));
    const additionalUsage = (ordersWithCoupon || [])
      .filter(o => !trackedOrderIds.has(o.id))
      .map(o => ({
        customer_email: o.customer_email,
        order_id: o.id,
        order_total: parseFloat(o.total) || 0,
        discount_amount: parseFloat(o.discount) || 0,
        used_at: o.created_at,
      }));
    
    const allUsage = [...(usageData || []), ...additionalUsage];

    return res.status(200).json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
        minOrderValue: parseFloat(coupon.min_order_value) || 0,
        maxDiscount: coupon.max_discount ? parseFloat(coupon.max_discount) : null,
        maxUses: coupon.max_uses,
        currentUses: coupon.current_uses || allUsage.length || 0,
        isSingleUse: coupon.is_single_use,
        startsAt: coupon.starts_at,
        expiresAt: coupon.expires_at,
        isActive: coupon.is_active,
        createdAt: coupon.created_at,
        totalRevenue: parseFloat(coupon.total_revenue_generated) || allUsage.reduce((sum, u) => sum + parseFloat(u.order_total || 0), 0),
        totalDiscount: parseFloat(coupon.total_discount_given) || allUsage.reduce((sum, u) => sum + parseFloat(u.discount_amount || 0), 0),
        averageOrderValue: allUsage.length > 0 
          ? allUsage.reduce((sum, u) => sum + parseFloat(u.order_total || 0), 0) / allUsage.length 
          : 0,
        usageHistory: allUsage.map(u => ({
          customer: u.customer_email?.split('@')[0] || 'Customer',
          email: u.customer_email || '',
          orderId: u.order_id || null,
          orderTotal: parseFloat(u.order_total) || 0,
          discount: parseFloat(u.discount_amount) || 0,
          usedAt: u.used_at,
        })),
      },
    });

  } catch (err) {
    console.error('Get coupon error:', err);
    return res.status(500).json({ error: 'Failed to fetch coupon', details: err.message });
  }
}

// =============================================================================
// POST create coupon
// =============================================================================
async function createCoupon(req, res) {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      max_uses,
      is_single_use,
      starts_at,
      expires_at,
      is_active,
    } = req.body;

    // Validation
    if (!code || !discount_type) {
      return res.status(400).json({ error: 'Code and discount type are required' });
    }

    const validTypes = ['percentage', 'fixed', 'free_shipping'];
    if (!validTypes.includes(discount_type)) {
      return res.status(400).json({ error: 'Invalid discount type' });
    }

    // Check for duplicate code
    const { data: existing } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const { data: coupon, error: insertError } = await supabase
      .from('coupons')
      .insert({
        code: code.toUpperCase(),
        description: description || null,
        discount_type,
        discount_value: parseFloat(discount_value) || 0,
        min_order_value: parseFloat(min_order_value) || 0,
        max_discount: max_discount ? parseFloat(max_discount) : null,
        max_uses: max_uses ? parseInt(max_uses) : null,
        is_single_use: is_single_use || false,
        starts_at: starts_at || new Date().toISOString(),
        expires_at: expires_at || null,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
        minOrderValue: parseFloat(coupon.min_order_value),
        maxUses: coupon.max_uses,
        currentUses: 0,
        isSingleUse: coupon.is_single_use,
        startsAt: coupon.starts_at,
        expiresAt: coupon.expires_at,
        isActive: coupon.is_active,
        createdAt: coupon.created_at,
        totalRevenue: 0,
        totalDiscount: 0,
        usageHistory: [],
      },
    });

  } catch (err) {
    console.error('Create coupon error:', err);
    return res.status(500).json({ error: 'Failed to create coupon', details: err.message });
  }
}

// =============================================================================
// PUT update coupon
// =============================================================================
async function updateCoupon(req, res, id) {
  try {
    const updates = {};
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      max_uses,
      is_single_use,
      starts_at,
      expires_at,
      is_active,
    } = req.body;

    if (code !== undefined) updates.code = code.toUpperCase();
    if (description !== undefined) updates.description = description;
    if (discount_type !== undefined) updates.discount_type = discount_type;
    if (discount_value !== undefined) updates.discount_value = parseFloat(discount_value);
    if (min_order_value !== undefined) updates.min_order_value = parseFloat(min_order_value) || 0;
    if (max_discount !== undefined) updates.max_discount = max_discount ? parseFloat(max_discount) : null;
    if (max_uses !== undefined) updates.max_uses = max_uses ? parseInt(max_uses) : null;
    if (is_single_use !== undefined) updates.is_single_use = is_single_use;
    if (starts_at !== undefined) updates.starts_at = starts_at;
    if (expires_at !== undefined) updates.expires_at = expires_at;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: coupon, error: updateError } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    return res.status(200).json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
        minOrderValue: parseFloat(coupon.min_order_value),
        maxUses: coupon.max_uses,
        currentUses: coupon.current_uses,
        isSingleUse: coupon.is_single_use,
        startsAt: coupon.starts_at,
        expiresAt: coupon.expires_at,
        isActive: coupon.is_active,
      },
    });

  } catch (err) {
    console.error('Update coupon error:', err);
    return res.status(500).json({ error: 'Failed to update coupon', details: err.message });
  }
}

// =============================================================================
// DELETE coupon
// =============================================================================
async function deleteCoupon(req, res, id) {
  try {
    const { error: deleteError } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });

  } catch (err) {
    console.error('Delete coupon error:', err);
    return res.status(500).json({ error: 'Failed to delete coupon', details: err.message });
  }
}