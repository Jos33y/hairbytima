// =============================================================================
// Public Coupon Validation API - /api/coupons/validate
// =============================================================================

import { supabase } from './../_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, cartTotal, customerEmail } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const normalizedCode = code.toUpperCase().trim();

    // Find the coupon
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single();

    if (fetchError || !coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    // Check if coupon has started
    if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
      return res.status(400).json({ error: 'This coupon is not yet active' });
    }

    // Check if coupon has expired
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }

    // Check minimum order value
    if (coupon.min_order_value && cartTotal < parseFloat(coupon.min_order_value)) {
      return res.status(400).json({ 
        error: `Minimum order of $${coupon.min_order_value} required for this coupon` 
      });
    }

    // Check usage limit
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    }

    // Check single use per customer
    if (coupon.is_single_use && customerEmail) {
      const { data: existingUsage } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('customer_email', customerEmail.toLowerCase())
        .single();

      if (existingUsage) {
        return res.status(400).json({ error: 'You have already used this coupon' });
      }
    }

    // Calculate discount
    let discount = 0;
    let discountDisplay = '';

    switch (coupon.discount_type) {
      case 'percentage':
        discount = (cartTotal * parseFloat(coupon.discount_value)) / 100;
        // Apply max discount if set
        if (coupon.max_discount && discount > parseFloat(coupon.max_discount)) {
          discount = parseFloat(coupon.max_discount);
        }
        discountDisplay = `-${coupon.discount_value}%`;
        break;

      case 'fixed':
        discount = Math.min(parseFloat(coupon.discount_value), cartTotal);
        discountDisplay = `-$${coupon.discount_value}`;
        break;

      case 'free_shipping':
        discount = 0; // Shipping handled separately
        discountDisplay = 'Free Shipping';
        break;

      default:
        break;
    }

    return res.status(200).json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
        maxDiscount: coupon.max_discount ? parseFloat(coupon.max_discount) : null,
        minOrderValue: coupon.min_order_value ? parseFloat(coupon.min_order_value) : null,
        isFreeShipping: coupon.discount_type === 'free_shipping',
      },
      discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
      discountDisplay,
    });

  } catch (err) {
    console.error('Coupon validation error:', err);
    return res.status(500).json({ error: 'Failed to validate coupon' });
  }
}