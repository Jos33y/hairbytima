// ==========================================================================
// Wishlist Store - Zustand store with Supabase sync & Analytics
// ==========================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistService } from '@services/wishlistService';
import { trackWishlistAdd, trackWishlistRemove } from '@utils/analytics';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      isLoading: false,
      isInitialized: false,
      error: null,

      // Get visitor ID for sharing
      getVisitorId: () => {
        return wishlistService.getVisitorId();
      },

      // Initialize - fetch from Supabase
      initialize: async () => {
        const { isInitialized, items: localItems } = get();
        
        // Only initialize once per session
        if (isInitialized) return;
        
        set({ isLoading: true, error: null });

        try {
          // Sync any local items to Supabase first
          if (localItems.length > 0) {
            await wishlistService.syncLocalToSupabase(localItems);
          }

          // Fetch from Supabase
          const items = await wishlistService.getWishlist();
          
          set({ 
            items, 
            isLoading: false, 
            isInitialized: true,
            error: null,
          });
        } catch (error) {
          console.error('Failed to initialize wishlist:', error);
          set({ 
            isLoading: false, 
            isInitialized: true,
            error: error.message,
          });
          // Keep local items as fallback
        }
      },

      // Add item to wishlist
      addItem: async (product) => {
        const { items } = get();
        const exists = items.some(item => item.id === product.id);
        
        if (exists) return false;

        // Optimistic update
        const newItem = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.image,
          inStock: product.inStock ?? true,
          category: product.category,
          addedAt: new Date().toISOString(),
        };

        set({ items: [newItem, ...items] });
        
        // Track wishlist add
        trackWishlistAdd(product);

        // Sync to Supabase
        try {
          await wishlistService.addToWishlist(product.id);
        } catch (error) {
          console.error('Failed to sync wishlist add:', error);
          // Don't rollback - local state is the source of truth for UX
        }

        return true;
      },

      // Remove item from wishlist
      removeItem: async (productId) => {
        const { items } = get();
        const removedItem = items.find(item => item.id === productId);
        
        // Optimistic update
        set({ items: items.filter(item => item.id !== productId) });
        
        // Track wishlist remove
        if (removedItem) {
          trackWishlistRemove(removedItem);
        }

        // Sync to Supabase
        try {
          await wishlistService.removeFromWishlist(productId);
        } catch (error) {
          console.error('Failed to sync wishlist remove:', error);
        }
      },

      // Toggle item in wishlist
      toggleItem: async (product) => {
        const { items, addItem, removeItem } = get();
        const exists = items.some(item => item.id === product.id);
        
        if (exists) {
          await removeItem(product.id);
          return false; // Removed
        } else {
          await addItem(product);
          return true; // Added
        }
      },

      // Check if item is in wishlist (sync check)
      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(item => item.id === productId);
      },

      // Clear entire wishlist
      clearWishlist: async () => {
        // Optimistic update
        set({ items: [] });

        // Sync to Supabase
        try {
          await wishlistService.clearWishlist();
        } catch (error) {
          console.error('Failed to sync wishlist clear:', error);
        }
      },

      // Get item count
      getItemCount: () => {
        return get().items.length;
      },

      // Refresh from Supabase
      refresh: async () => {
        set({ isLoading: true, error: null });

        try {
          const items = await wishlistService.getWishlist();
          set({ items, isLoading: false });
        } catch (error) {
          console.error('Failed to refresh wishlist:', error);
          set({ isLoading: false, error: error.message });
        }
      },
    }),
    {
      name: 'hbt-wishlist',
      version: 2,
      partialize: (state) => ({ 
        items: state.items,
        // Don't persist loading/initialized states
      }),
    }
  )
);

