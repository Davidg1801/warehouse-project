import { ProductSort } from '../models/product-filters.model';
import { ProductQueryParams } from '../models/product-query-params.model';

export function mapQueryParamsToSort(query: ProductQueryParams): ProductSort {
  if (!query.orderBy) return '';
  return `${query.orderBy}_${query.descending ? 'DESC' : 'ASC'}` as ProductSort;
}

export function mapSortToQueryParams(
  sort?: string,
): { orderBy: string; descending: boolean } | undefined {
  if (!sort) return undefined;
  const [orderBy, direction] = sort.split('_');
  return {
    orderBy,
    descending: direction === 'DESC',
  };
}
