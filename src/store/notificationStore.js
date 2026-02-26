// ==========================================================================
// Notification Store - Admin Notifications State
// ==========================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = import.meta.env.VITE_API_URL || '';
const API_URL = `${API_BASE}/api`;

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      isLoading: false,
      error: null,
      soundEnabled: true,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },

      // Getters
      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.is_read).length;
      },

      getRecentNotifications: (limit = 5) => {
        return get()
          .notifications
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, limit);
      },

      // Fetch notifications from API
      fetchNotifications: async (options = {}) => {
        const { unread_only = false, page = 1, limit = 20 } = options;
        const token = JSON.parse(localStorage.getItem('hbt-admin-auth') || '{}')?.state?.token;

        if (!token) return;

        set({ isLoading: true, error: null });

        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
          });

          if (unread_only) {
            params.append('unread_only', 'true');
          }

          const response = await fetch(`${API_URL}/admin/notifications?${params}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch notifications');
          }

          // Transform API data to match component expectations
          const transformedNotifications = data.notifications.map(n => ({
            ...n,
            isRead: n.is_read,
            createdAt: n.created_at,
            // Extract from metadata JSONB
            orderId: n.metadata?.order_id,
            productId: n.metadata?.product_id,
          }));

          set({
            notifications: transformedNotifications,
            pagination: data.pagination,
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          console.error('Fetch notifications error:', error);
          return null;
        }
      },

      // Mark single notification as read
      markAsRead: async (notificationId) => {
        const token = JSON.parse(localStorage.getItem('hbt-admin-auth') || '{}')?.state?.token;

        // Optimistic update
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, isRead: true } : n
          ),
        }));

        try {
          const response = await fetch(`${API_URL}/admin/notifications`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ id: notificationId }),
          });

          if (!response.ok) {
            throw new Error('Failed to mark as read');
          }
        } catch (error) {
          // Revert on error
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, is_read: false, isRead: false } : n
            ),
          }));
          console.error('Mark as read error:', error);
        }
      },

      // Mark all notifications as read
      markAllAsRead: async () => {
        const token = JSON.parse(localStorage.getItem('hbt-admin-auth') || '{}')?.state?.token;

        // Optimistic update
        const previousNotifications = get().notifications;
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true, isRead: true })),
        }));

        try {
          const response = await fetch(`${API_URL}/admin/notifications`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ mark_all: true }),
          });

          if (!response.ok) {
            throw new Error('Failed to mark all as read');
          }
        } catch (error) {
          // Revert on error
          set({ notifications: previousNotifications });
          console.error('Mark all as read error:', error);
        }
      },

      // Delete notification
      deleteNotification: async (notificationId) => {
        const token = JSON.parse(localStorage.getItem('hbt-admin-auth') || '{}')?.state?.token;

        // Optimistic update
        const previousNotifications = get().notifications;
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        }));

        try {
          const response = await fetch(`${API_URL}/admin/notifications?id=${notificationId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to delete notification');
          }
        } catch (error) {
          // Revert on error
          set({ notifications: previousNotifications });
          console.error('Delete notification error:', error);
        }
      },

      // Clear all notifications (local only - use with caution)
      clearAllNotifications: async () => {
        const token = JSON.parse(localStorage.getItem('hbt-admin-auth') || '{}')?.state?.token;
        const notifications = get().notifications;

        // Delete all one by one
        for (const notification of notifications) {
          try {
            await fetch(`${API_URL}/admin/notifications?id=${notification.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          } catch (error) {
            console.error('Delete notification error:', error);
          }
        }

        set({ notifications: [] });
      },

      // Toggle sound
      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      // Play notification sound
      playNotificationSound: () => {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 800;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
          console.log('Notification sound not available');
        }
      },

      // Add notification locally (for real-time updates via websocket later)
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: notification.id || Date.now().toString(),
          is_read: false,
          isRead: false,
          created_at: notification.created_at || new Date().toISOString(),
          createdAt: notification.created_at || new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));

        if (get().soundEnabled) {
          get().playNotificationSound();
        }

        return newNotification;
      },
    }),
    {
      name: 'hbt-notifications',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

