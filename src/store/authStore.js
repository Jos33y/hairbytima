// =============================================================================
// Admin Authentication Store
// =============================================================================
// Handles admin login, logout, and session management
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = import.meta.env.VITE_API_URL || '';
const API_URL = `${API_BASE}/api`;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      admin: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          set({
            admin: data.admin,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Logout
      logout: async () => {
        const { token } = get();

        if (token) {
          try {
            await fetch(`${API_URL}/admin/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          } catch (error) {
            console.error('Logout API error:', error);
          }
        }

        // Clear local state
        set({
          admin: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Verify token is still valid
      checkAuth: async () => {
        const { token } = get();

        if (!token) {
          set({ isAuthenticated: false, admin: null });
          return false;
        }

        try {
          const response = await fetch(`${API_URL}/admin/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Token invalid');
          }

          const data = await response.json();

          set({
            admin: data.admin,
            isAuthenticated: true,
          });

          return true;
        } catch (error) {
          // Token is invalid, clear auth state
          set({
            admin: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      // Get auth headers for API requests
      getAuthHeaders: () => {
        const { token } = get();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      },

      // Check if admin has specific role
      hasRole: (requiredRole) => {
        const { admin } = get();
        if (!admin) return false;

        const roleHierarchy = {
          'super_admin': 3,
          'admin': 2,
          'manager': 1,
        };

        const adminLevel = roleHierarchy[admin.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return adminLevel >= requiredLevel;
      },

      // Permission helpers
      canManageProducts: () => get().hasRole('admin'),
      canManageOrders: () => get().hasRole('manager'),
      canManageCoupons: () => get().hasRole('admin'),
      canManageCustomers: () => get().hasRole('admin'),
      canManageCategories: () => get().hasRole('admin'),
      canManageSettings: () => get().hasRole('admin'),
      canManageAdmins: () => get().hasRole('super_admin'),

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'hbt-admin-auth',
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

