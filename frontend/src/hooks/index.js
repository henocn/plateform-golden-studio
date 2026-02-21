import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import PERMISSIONS from '../config/permissions';

/**
 * Role & permission helper hook.
 * Permissions are loaded from config/permissions.js — éditez ce fichier pour modifier les accès.
 */
export function usePermissions() {
  const { user } = useAuthStore();

  return useMemo(() => {
    const role = user?.role || '';
    const userType = user?.user_type || '';
    const isInternal = userType === 'internal';
    const isClient = userType === 'client';
    const isSuperAdmin = role === 'super_admin';

    /** Check if the current user's role has the given permission */
    const can = (permission) => {
      if (isSuperAdmin) return true;
      const allowedRoles = PERMISSIONS[permission];
      if (!allowedRoles) return false;
      return allowedRoles.includes(role);
    };

    return {
      user,
      role,
      userType,
      isInternal,
      isClient,
      isSuperAdmin,
      isAdmin: ['super_admin', 'admin'].includes(role),
      isValidator: role === 'validator' || role === 'client_validator',
      isClientAdmin: role === 'client_admin',
      can,
      // Shortcuts
      canCreateProject: can('projects.create'),
      canCreateTask: can('tasks.create'),
      canCreateProposal: can('proposals.create'),
      canValidateProposal: can('proposals.validate'),
      canCreateEvent: can('calendar.manage'),
      canUploadMedia: can('mediatheque.upload') || can('mediatheque.upload_client'),
      canManageUsers: can('users.manage_internal') || can('users.manage_clients') || can('users.manage_own_org'),
      canViewAudit: can('audit.view'),
      canViewReporting: can('reporting.global') || can('reporting.own_org'),
      // Folder permissions
      canCreateFolder: can('folders.create'),
      canEditFolder: can('folders.edit'),
      canDeleteFolder: can('folders.delete'),
      canViewFolder: can('folders.view'),
    };
  }, [user]);
}

/**
 * Hook for async data fetching with loading / error states
 */
export function useAsync(asyncFn, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  useEffect(() => {
    if (immediate) execute();
  }, []);

  return { data, loading, error, execute, setData };
}

/**
 * Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Pagination state management
 */
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit) || 1;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const goNext = () => hasNext && setPage((p) => p + 1);
  const goPrev = () => hasPrev && setPage((p) => p - 1);
  const goTo = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  return {
    page, limit, total, totalPages,
    hasNext, hasPrev,
    setPage, setLimit, setTotal,
    goNext, goPrev, goTo,
  };
}

/**
 * Click outside hook for dropdowns/modals
 */
export function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}
