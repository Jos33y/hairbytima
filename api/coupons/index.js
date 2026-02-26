// =============================================================================
// Public Coupons API - /api/coupons
// =============================================================================
// POST: Validate and apply coupon at checkout
// =============================================================================

import { supabase } from './../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return validateCoupon(req, res);
}

// =============================================================================
// POST - Validate coupon
// =============================================================================
async function validateCoupon(req, res) {
  try {
    const { code, email, cart_total } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Fetch coupon
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (fetchError || !coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    const now = new Date();

    // Check if active
    if (!coupon.is_active) {
      return res.status(400).json({ error: 'This coupon is no longer active' });
    }

    // Check if expired
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }

    // Check start date
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return res.status(400).json({ error: 'This coupon is not yet valid' });
    }

    // Check max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    }

    // Check minimum order value
    const cartTotal = parseFloat(cart_total) || 0;
    if (coupon.min_order_value && cartTotal < parseFloat(coupon.min_order_value)) {
      return res.status(400).json({ 
        error: `Minimum order of $${parseFloat(coupon.min_order_value).toFixed(2)} required for this coupon` 
      });
    }

    // Check single use per customer
    if (coupon.is_single_use && email) {
      const { data: previousUse } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('customer_email', email.toLowerCase())
        .single();

      if (previousUse) {
        return res.status(400).json({ error: 'You have already used this coupon' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = cartTotal * (parseFloat(coupon.discount_value) / 100);
      // Apply max discount cap if set
      if (coupon.max_discount && discountAmount > parseFloat(coupon.max_discount)) {
        discountAmount = parseFloat(coupon.max_discount);
      }
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = parseFloat(coupon.discount_value);
      // Don't let discount exceed cart total
      if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
      }
    }
    // For free_shipping, discountAmount stays 0 - shipping is handled separately

    return res.status(200).json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
        discountAmount: Math.round(discountAmount * 100) / 100,
        minOrderValue: parseFloat(coupon.min_order_value) || 0,
        isFreeShipping: coupon.discount_type === 'free_shipping',
      },
      message: coupon.discount_type === 'free_shipping' 
        ? 'Free shipping applied!' 
        : `Discount of $${discountAmount.toFixed(2)} applied!`,
    });

  } catch (err) {
    console.error('Validate coupon error:', err);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
}