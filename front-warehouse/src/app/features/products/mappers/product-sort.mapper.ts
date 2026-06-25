import { ProductQueryParams } from '../models/product-query-params.model';

export type ProductSort =
  | 'Name_ASC'
  | 'Name_DESC'
  | 'Price_ASC'
  | 'Price_DESC'
  | 'Quantity_ASC'
  | 'Quantity_DESC';

export function mapQueryParamsToSort(query: ProductQueryParams): ProductSort | '' {
  if (!query.orderBy) return '';
  return `${query.orderBy}_${query.descending ? 'DESC' : 'ASC'}` as ProductSort;
}

export function mapSortToQueryParams(
  sort?: string,
): { orderBy: string; descending: boolean } | undefined {
  switch (sort) {
    case 'Name_ASC':
      return { orderBy: 'Name', descending: false };
    case 'Name_DESC':
      return { orderBy: 'Name', descending: true };
    case 'Price_ASC':
      return { orderBy: 'Price', descending: false };
    case 'Price_DESC':
      return { orderBy: 'Price', descending: true };
    case 'Quantity_ASC':
      return { orderBy: 'Quantity', descending: false };
    case 'Quantity_DESC':
      return { orderBy: 'Quantity', descending: true };
    default:
      return undefined;
  }
}
