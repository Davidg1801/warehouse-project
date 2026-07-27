import { ProductSort } from '../models/product-filters.model';
import { ProductQueryParams } from '../models/product-query-params.model';
import { mapQueryParamsToSort, mapSortToQueryParams } from './product-sort.mapper';

describe('mapQueryParamsToSort', () => {
  it.each<{ query: ProductQueryParams; expected: ProductSort }>([
    { query: { orderBy: 'Name', descending: false }, expected: 'Name_ASC' },
    { query: { orderBy: 'Name', descending: true }, expected: 'Name_DESC' },
    { query: { orderBy: 'Price', descending: false }, expected: 'Price_ASC' },
    { query: { orderBy: 'Price', descending: true }, expected: 'Price_DESC' },
    { query: { orderBy: 'Quantity', descending: false }, expected: 'Quantity_ASC' },
    { query: { orderBy: 'Quantity', descending: true }, expected: 'Quantity_DESC' },
    { query: {}, expected: '' },
  ])('should change $query to "$expected"', ({ query, expected }) => {
    expect(mapQueryParamsToSort(query)).toBe(expected);
  });
});

describe('mapSortToQueryParams', () => {
  it.each<{ sort: ProductSort; expected: ProductQueryParams }>([
    { sort: 'Name_ASC', expected: { orderBy: 'Name', descending: false } },
    { sort: 'Name_DESC', expected: { orderBy: 'Name', descending: true } },
    { sort: 'Price_ASC', expected: { orderBy: 'Price', descending: false } },
    { sort: 'Price_DESC', expected: { orderBy: 'Price', descending: true } },
    { sort: 'Quantity_ASC', expected: { orderBy: 'Quantity', descending: false } },
    { sort: 'Quantity_DESC', expected: { orderBy: 'Quantity', descending: true } },
  ])('should change $sort to "$expected"', ({ sort, expected }) => {
    expect(mapSortToQueryParams(sort)).toEqual(expected);
  });

  it('should return undefined for empty "" or undefined', () => {
    expect(mapSortToQueryParams('')).toBeUndefined();
    expect(mapSortToQueryParams(undefined)).toBeUndefined();
  });
});
