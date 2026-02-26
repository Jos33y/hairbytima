// ==========================================================================
// Cart Store - Zustand with Persist (includes coupon & analytics)
// ==========================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  trackAddToCart, 
  trackRemoveFromCart, 
  trackUpdateCartQuantity,
  trackApplyCoupon,
  trackRemoveCoupon 
} from '@utils/analytics';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      // Coupon state (persisted!)
      appliedCoupon: null,
      couponDiscount: 0,

      // Add item to cart
      addItem: (product) => {
        const { items } = get();
        const existingItem = items.find(
          item => item.id === product.id && item.length === product.length
        );

        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === product.id && item.length === product.length
                ? { ...item, quantity: item.quantity + (product.quantity || 1) }
                : item
            ),
          });
        } else {
          set({
            items: [...items, { ...product, quantity: product.quantity || 1 }],
          });
        }
        
        // Track add to cart (if not already tracked from ProductDetailsPage)
        // This catches adds from other sources like quick add buttons
      },

      // Remove item from cart
      removeItem: (productId, length) => {
        const { items } = get();
        const removedItem = items.find(
          item => item.id === productId && item.length === length
        );
        
        set({
          items: items.filter(
            item => !(item.id === productId && item.length === length)
          ),
        });
        
        // Track removal
        if (removedItem) {
          trackRemoveFromCart(removedItem);
        }
      },

      // Update item quantity
      updateQuantity: (productId, length, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId, length);
          return;
        }
        
        const { items } = get();
        const item = items.find(
          i => i.id === productId && i.length === length
        );
        const oldQuantity = item?.quantity || 0;
        
        set({
          items: items.map(item =>
            item.id === productId && item.length === length
              ? { ...item, quantity: Math.min(10, quantity) }
              : item
          ),
        });
        
        // Track quantity update
        if (item) {
          trackUpdateCartQuantity(item, oldQuantity, Math.min(10, quantity));
        }
      },

      // Clear entire cart
      clearCart: () => set({ 
        items: [],
        appliedCoupon: null,
        couponDiscount: 0,
      }),

      // Get unique item count (for cart badge)
      getItemCount: () => {
        return get().items.length;
      },

      // Get total quantity (sum of all quantities)
      getTotalQuantity: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Get subtotal (in base currency USD)
      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      // Get total savings from sale items (compareAtPrice - price)
      getTotalSavings: () => {
        return get().items.reduce((total, item) => {
          if (item.compareAtPrice && item.compareAtPrice > item.price) {
            return total + (item.compareAtPrice - item.price) * item.quantity;
          }
          return total;
        }, 0);
      },

      // ==========================================================================
      // Coupon Methods
      // ==========================================================================

      // Apply coupon (called after validation)
      applyCoupon: (coupon, discount) => {
        set({
          appliedCoupon: coupon,
          couponDiscount: discount,
        });
        
        // Track coupon applied
        trackApplyCoupon(coupon.code, discount);
      },

      // Remove coupon
      removeCoupon: () => {
        const { appliedCoupon } = get();
        
        // Track coupon removal before clearing
        if (appliedCoupon) {
          trackRemoveCoupon(appliedCoupon.code);
        }
        
        set({
          appliedCoupon: null,
          couponDiscount: 0,
        });
      },

      // Recalculate discount (when subtotal changes)
      recalculateDiscount: () => {
        const { appliedCoupon, getSubtotal } = get();
        if (!appliedCoupon) return;

        const subtotal = getSubtotal();
        let discount = 0;

        if (appliedCoupon.discountType === 'percentage') {
          discount = (subtotal * appliedCoupon.discountValue) / 100;
          if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
            discount = appliedCoupon.maxDiscount;
          }
        } else if (appliedCoupon.discountType === 'fixed') {
          discount = Math.min(appliedCoupon.discountValue, subtotal);
        }
        // free_shipping type has 0 discount on subtotal

        set({ couponDiscount: discount });
      },

      // Check if cart meets coupon minimum
      meetsMinimum: () => {
        const { appliedCoupon, getSubtotal } = get();
        if (!appliedCoupon || !appliedCoupon.minOrderValue) return true;
        return getSubtotal() >= appliedCoupon.minOrderValue;
      },

      // Get cart total (subtotal - discount)
      getCartTotal: () => {
        const { getSubtotal, couponDiscount } = get();
        return Math.max(0, getSubtotal() - couponDiscount);
      },
    }),
    {
      name: 'hbt-cart',
      // Only persist items and coupon
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
        couponDiscount: state.couponDiscount,
      }),
    }
  )
);

