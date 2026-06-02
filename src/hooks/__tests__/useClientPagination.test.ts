import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClientPagination } from '../useClientPagination';

const TEN_ITEMS = Array.from({ length: 10 }, (_, i) => i + 1);
const TWENTY_FIVE = Array.from({ length: 25 }, (_, i) => i + 1);

describe('useClientPagination', () => {
  it('starts on page 1 with default page size 10', () => {
    const { result } = renderHook(() => useClientPagination(TEN_ITEMS));
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(10);
  });

  it('returns all items on the first page when count ≤ pageSize', () => {
    const { result } = renderHook(() => useClientPagination(TEN_ITEMS));
    expect(result.current.paginatedItems).toEqual(TEN_ITEMS);
  });

  it('paginates correctly across multiple pages', () => {
    const { result } = renderHook(() => useClientPagination(TWENTY_FIVE));
    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginatedItems).toHaveLength(10); // page 1: items 1–10
  });

  it('slices the correct items for page 2', () => {
    const { result } = renderHook(() => useClientPagination(TWENTY_FIVE));
    act(() => { result.current.setCurrentPage(2); });
    expect(result.current.paginatedItems).toEqual(TWENTY_FIVE.slice(10, 20));
    expect(result.current.rangeStart).toBe(11);
    expect(result.current.rangeEnd).toBe(20);
  });

  it('clamps to the last page if currentPage exceeds totalPages after items shrink', () => {
    let items = TWENTY_FIVE;
    const { result, rerender } = renderHook(() => useClientPagination(items));

    act(() => { result.current.setCurrentPage(3); });
    expect(result.current.currentPage).toBe(3);

    // Shrink items so there are only 2 pages.
    items = TWENTY_FIVE.slice(0, 15);
    rerender();
    expect(result.current.currentPage).toBe(2);
  });

  it('resets to page 1 when pageSize changes', () => {
    const { result } = renderHook(() => useClientPagination(TWENTY_FIVE));
    act(() => { result.current.setCurrentPage(3); });
    act(() => { result.current.setPageSize(25); });
    expect(result.current.currentPage).toBe(1);
  });

  it('reports rangeStart and rangeEnd as 0 for an empty list', () => {
    const { result } = renderHook(() => useClientPagination([]));
    expect(result.current.rangeStart).toBe(0);
    expect(result.current.rangeEnd).toBe(0);
    expect(result.current.totalPages).toBe(1);
  });

  it('respects a custom initialPageSize', () => {
    const { result } = renderHook(() =>
      useClientPagination(TWENTY_FIVE, { initialPageSize: 5 })
    );
    expect(result.current.pageSize).toBe(5);
    expect(result.current.totalPages).toBe(5);
  });
});
