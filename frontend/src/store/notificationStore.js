import { create } from 'zustand';
import { notificationsAPI } from '../api/services';


// ═══════════════════════════════════════════════════
//           NotificationStore (Zustand)
// ═══════════════════════════════════════════════════


export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  panelOpen: false,

  /* Charge les notifications depuis l'API */
  fetchNotifications: async (page = 1, limit = 50) => {
    set({ loading: true });
    try {
      const res = await notificationsAPI.list({ page, limit });
      set({
        notifications: res.data?.data || [],
        total: res.data?.meta?.total || 0,
      });
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
    } finally {
      set({ loading: false });
    }
  },

  /* Charge le compteur de non lues */
  fetchUnreadCount: async () => {
    try {
      const res = await notificationsAPI.unreadCount();
      set({ unreadCount: res.data?.data?.count || 0 });
    } catch (err) {
      console.error('Erreur compteur notifications:', err);
    }
  },

  /* Marque une notification comme lue */
  markAsRead: async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Erreur markAsRead:', err);
    }
  },

  /* Marque toutes les notifications comme lues */
  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Erreur markAllAsRead:', err);
    }
  },

  /* Supprime une notification */
  removeNotification: async (id) => {
    try {
      await notificationsAPI.remove(id);
      set((state) => {
        const removed = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: removed && !removed.is_read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (err) {
      console.error('Erreur suppression notification:', err);
    }
  },

  /* Ouvre / ferme le panneau de notifications */
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  closePanel: () => set({ panelOpen: false }),
}));
