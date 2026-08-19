import { SortState } from '@shared/models/sort.model';

export interface ProductQueryParams {
  pageNumber?: number;
  pageSize?: number;
  descending?: boolean;
  orderBy?: ProductSortColumn;
  name?: string;
  categoryIds?: number[];
}

export type ProductSortColumn = 'Name' | 'Price' | 'Quantity';
export type ProductSortState = SortState<ProductSortColumn>;
