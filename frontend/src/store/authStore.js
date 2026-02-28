import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      requires2FA: false,
      tempCredentials: null,

      // ── Login ──────────────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const response = data.data;

          // 2FA required?
          if (response.requires_2fa) {
            set({
              requires2FA: true,
              tempCredentials: { email, password },
              isLoading: false,
            });
            return { requires2FA: true };
          }

          set({
            user: response.user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            requires2FA: false,
            tempCredentials: null,
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // ── Verify 2FA ─────────────────────────────────────
      verify2FA: async (code) => {
        set({ isLoading: true });
        try {
          const { tempCredentials } = get();
          const { data } = await api.post('/auth/2fa/verify', {
            email: tempCredentials.email,
            password: tempCredentials.password,
            code,
          });
          const response = data.data;

          set({
            user: response.user,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            requires2FA: false,
            tempCredentials: null,
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // ── Refresh token ──────────────────────────────────
      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) throw new Error('No refresh token');

          const { data } = await api.post('/auth/refresh', {
            refresh_token: refreshToken,
          });
          const response = data.data;

          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
          });

          return response.access_token;
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      // ── Fetch current user ─────────────────────────────
      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          const userData = data.data.user || data.data;
          set({ user: userData });
        } catch (error) {
          get().logout();
        }
      },

      // ── Logout ─────────────────────────────────────────
      logout: async () => {
        try {
          const { refreshToken } = get();
          if (refreshToken) {
            await api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {});
          }
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            requires2FA: false,
            tempCredentials: null,
          });
        }
      },

      // ── Check role ─────────────────────────────────────
      hasRole: (...roles) => {
        const { user } = get();
        return user && roles.includes(user.role);
      },

      isInternal: () => {
        const { user } = get();
        return user?.user_type === 'internal';
      },
    }),
    {
      name: 'govcom-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
