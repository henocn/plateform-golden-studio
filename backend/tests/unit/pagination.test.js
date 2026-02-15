'use strict';

const {
  parsePagination,
  buildPaginationMeta,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} = require('../../src/utils/pagination');

describe('Pagination utilities', () => {
  describe('parsePagination', () => {
    test('should return defaults when no query provided', () => {
      const result = parsePagination();
      expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    test('should return defaults for empty object', () => {
      const result = parsePagination({});
      expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    test('should parse valid page and limit', () => {
      const result = parsePagination({ page: '3', limit: '10' });
      expect(result).toEqual({ page: 3, limit: 10, offset: 20 });
    });

    test('should default page to 1 if invalid', () => {
      const result = parsePagination({ page: '-1', limit: '10' });
      expect(result.page).toBe(1);
    });

    test('should default page to 1 if NaN', () => {
      const result = parsePagination({ page: 'abc' });
      expect(result.page).toBe(1);
    });

    test('should default limit to DEFAULT_LIMIT if invalid', () => {
      const result = parsePagination({ limit: '0' });
      expect(result.limit).toBe(DEFAULT_LIMIT);
    });

    test('should cap limit at MAX_LIMIT', () => {
      const result = parsePagination({ limit: '999' });
      expect(result.limit).toBe(MAX_LIMIT);
    });

    test('should calculate offset correctly', () => {
      expect(parsePagination({ page: '1', limit: '20' }).offset).toBe(0);
      expect(parsePagination({ page: '2', limit: '20' }).offset).toBe(20);
      expect(parsePagination({ page: '5', limit: '10' }).offset).toBe(40);
    });
  });

  describe('buildPaginationMeta', () => {
    test('should return correct meta object', () => {
      const meta = buildPaginationMeta(1, 20, 100);
      expect(meta).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
      });
    });

    test('should round up totalPages', () => {
      const meta = buildPaginationMeta(1, 20, 45);
      expect(meta.totalPages).toBe(3);
    });

    test('should handle 0 total', () => {
      const meta = buildPaginationMeta(1, 20, 0);
      expect(meta.totalPages).toBe(0);
    });

    test('should handle single page', () => {
      const meta = buildPaginationMeta(1, 20, 5);
      expect(meta.totalPages).toBe(1);
    });

    test('should handle exact boundary', () => {
      const meta = buildPaginationMeta(1, 10, 10);
      expect(meta.totalPages).toBe(1);
    });
  });

  describe('constants', () => {
    test('DEFAULT_PAGE should be 1', () => {
      expect(DEFAULT_PAGE).toBe(1);
    });

    test('DEFAULT_LIMIT should be 20', () => {
      expect(DEFAULT_LIMIT).toBe(20);
    });

    test('MAX_LIMIT should be 100', () => {
      expect(MAX_LIMIT).toBe(100);
    });
  });
});
