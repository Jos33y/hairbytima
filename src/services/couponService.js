// =============================================================================
// Coupon Service - Client-side coupon operations
// =============================================================================

import { supabase } from './supabase';

export const couponService = {
  async getAll() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getByCode(code) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async validate(code, cartTotal, customerEmail = null) {
    try {
      const coupon = await this.getByCode(code);

      if (!coupon) {
        return { valid: false, error: 'Invalid coupon code' };
      }

      if (!coupon.is_active) {
        return { valid: false, error: 'This coupon is no longer active' };
      }

      const now = new Date();

      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return { valid: false, error: 'This coupon is not yet active' };
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        return { valid: false, error: 'This coupon has expired' };
      }

      if (coupon.min_order_value && cartTotal < coupon.min_order_value) {
        return {
          valid: false,
          error: `Minimum order of $${coupon.min_order_value} required`,
        };
      }

      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return { valid: false, error: 'This coupon has reached its usage limit' };
      }

      // Check if single-use and already used by customer
      if (coupon.is_single_use && customerEmail) {
        const { data: usage } = await supabase
          .from('coupon_usage')
          .select('id')
          .eq('coupon_id', coupon.id)
          .eq('customer_email', customerEmail.toLowerCase())
          .single();

        if (usage) {
          return { valid: false, error: 'You have already used this coupon' };
        }
      }

      // Calculate discount
      let discount = 0;
      let discountDisplay = '';

      switch (coupon.discount_type) {
        case 'percentage':
          discount = (cartTotal * coupon.discount_value) / 100;
          // Apply max discount cap if set
          if (coupon.max_discount && discount > coupon.max_discount) {
            discount = coupon.max_discount;
          }
          discountDisplay = `${coupon.discount_value}% off`;
          break;
        case 'fixed':
          discount = Math.min(coupon.discount_value, cartTotal);
          discountDisplay = `$${coupon.discount_value} off`;
          break;
        case 'free_shipping':
          discount = 0;
          discountDisplay = 'Free shipping';
          break;
      }

      return { valid: true, coupon, discount, discountDisplay };
    } catch {
      return { valid: false, error: 'Invalid coupon code' };
    }
  },

  async create(coupon) {
    const { data, error } = await supabase
      .from('coupons')
      .insert({ ...coupon, code: coupon.code.toUpperCase() })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Record coupon usage after successful order
   * @param {string} couponId - Coupon UUID
   * @param {string} customerEmail - Customer email
   * @param {string} orderId - Order UUID
   * @param {number} discountAmount - Amount discounted (USD)
   * @param {number} orderTotal - Order total after discount (USD)
   */
  async incrementUsage(couponId, customerEmail, orderId, discountAmount, orderTotal) {
    try {
      // Increment current_uses counter on coupon
      const { error: rpcError } = await supabase.rpc('increment_coupon_usage', { 
        coupon_id: couponId 
      });
      
      if (rpcError) {
        console.error('Failed to increment coupon usage:', rpcError);
        // Continue anyway - don't block order
      }

      // Record usage in coupon_usage table (all fields required!)
      const { error: insertError } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id: couponId,
          customer_email: customerEmail.toLowerCase(),
          order_id: orderId,
          discount_amount: discountAmount,  // Required field!
          order_total: orderTotal,          // Required field!
          used_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Failed to record coupon usage:', insertError);
        // Log but don't throw - order already placed
      }

      return true;
    } catch (err) {
      console.error('Coupon usage tracking error:', err);
      // Don't throw - this shouldn't block order completion
      return false;
    }
  },
};

