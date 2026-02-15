import { useState, useCallback, useEffect, useRef } from 'react';

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
