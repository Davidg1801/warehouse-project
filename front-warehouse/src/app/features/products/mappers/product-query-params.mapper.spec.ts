import { describe, it, expect } from 'vitest';
import { Params } from '@angular/router';
import { mapRouteToProductQueryParams } from './product-query-params.mapper';

describe('mapRouteToProductQueryParams', () => {
  it('it should return default parameters (page number 1, page size 10) for empty params object', () => {
    const params: Params = {};
    const result = mapRouteToProductQueryParams(params);
    expect(result).toEqual({
      pageNumber: 1,
      pageSize: 10,
      name: undefined,
      orderBy: undefined,
      descending: undefined,
    });
  });

  it('should handle a single categoryId sent as a string', () => {
    const params: Params = { categoryIds: '5' };
    const result = mapRouteToProductQueryParams(params);
    expect(result.categoryIds).toEqual([5]);
  });

  it('should handle multiple categoryIds sent as an array of strings', () => {
    const params: Params = { categoryIds: ['1', '5', '2'] };
    const result = mapRouteToProductQueryParams(params);
    expect(result.categoryIds).toEqual([1, 5, 2]);
  });

  it('should set descending to false if query has orderBy and descending="false"', () => {
    const params: Params = { orderBy: 'Name', descending: 'false' };
    const result = mapRouteToProductQueryParams(params);
    expect(result.descending).toBe(false);
  });

  it('should set descending to undefined if query has not orderBy', () => {
    const params: Params = {};
    const result = mapRouteToProductQueryParams(params);
    expect(result.descending).toBe(undefined);
  });
});
