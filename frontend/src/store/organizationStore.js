import { create } from 'zustand';
import { organizationsAPI, uploadsUrl } from '../api/services';

export const useOrganizationStore = create((set, get) => ({
  current: null,
  loading: false,
  error: null,

  fetchCurrent: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await organizationsAPI.getCurrent();
      const org = data?.data ?? data;
      set({ current: org, loading: false });
      return org;
    } catch (err) {
      set({ error: err?.response?.data?.error?.message || 'Erreur chargement organisation', loading: false });
      return null;
    }
  },

  setCurrent: (org) => set({ current: org }),

  /** URL du logo (ou null si pas de logo). */
  logoUrl: () => {
    const { current } = get();
    const path = current?.logo_path;
    return path ? uploadsUrl(path) : null;
  },

  /** Nom affiché (short_name ou name). */
  displayName: () => {
    const { current } = get();
    return current?.short_name || current?.name || 'GovCom';
  },
}));
