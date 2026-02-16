import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';

// ── Permission matrix (mirrors backend role.middleware.js) ──
const PERMISSIONS = {
  // Internal roles
  super_admin: ['*'],
  admin:       ['projects.*', 'tasks.*', 'proposals.*', 'calendar.*', 'media.*', 'users.manage', 'organizations.*', 'reporting.*', 'audit.*'],
  validator:   ['projects.view', 'tasks.view', 'tasks.create', 'proposals.*', 'calendar.*', 'media.*', 'reporting.view'],
  contributor: ['projects.view', 'tasks.view', 'tasks.create', 'proposals.create', 'proposals.view', 'calendar.view', 'media.*'],
  viewer:      ['projects.view', 'tasks.view', 'proposals.view', 'calendar.view', 'media.view'],
  // Client roles
  client_admin:       ['projects.view', 'tasks.view', 'proposals.view', 'proposals.validate', 'calendar.view', 'media.view', 'media.upload', 'users.manage_org', 'reporting.view_org'],
  client_validator:   ['projects.view', 'tasks.view', 'proposals.view', 'proposals.validate', 'calendar.view', 'media.view'],
  client_contributor: ['projects.view', 'tasks.view', 'tasks.comment', 'proposals.view', 'calendar.view', 'media.view', 'media.upload'],
  client_reader:      ['projects.view', 'tasks.view', 'proposals.view', 'calendar.view', 'media.view'],
};

/**
 * Role & permission helper hook.
 * Returns booleans and a `can()` function for granular permission checks.
 */
export function usePermissions() {
  const { user } = useAuthStore();

  return useMemo(() => {
    const role = user?.role || '';
    const userType = user?.user_type || '';
    const isInternal = userType === 'internal';
    const isClient = userType === 'client';
    const perms = PERMISSIONS[role] || [];
    const isSuperAdmin = role === 'super_admin';

    const can = (permission) => {
      if (isSuperAdmin) return true;
      if (perms.includes('*')) return true;
      if (perms.includes(permission)) return true;
      // Wildcard match: 'projects.*' covers 'projects.create'
      const [domain] = permission.split('.');
      return perms.includes(`${domain}.*`);
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
      canCreateProject: can('projects.create') && isInternal,
      canCreateTask: can('tasks.create') && isInternal,
      canCreateProposal: can('proposals.create') && isInternal,
      canValidateProposal: can('proposals.validate'),
      canCreateEvent: can('calendar.create') && isInternal,
      canUploadMedia: can('media.upload'),
      canManageUsers: can('users.manage') || can('users.manage_org'),
      canViewAudit: can('audit.*') || can('audit.view'),
      canViewReporting: can('reporting.*') || can('reporting.view') || can('reporting.view_org'),
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
