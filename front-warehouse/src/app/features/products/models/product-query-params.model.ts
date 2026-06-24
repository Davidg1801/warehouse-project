export interface ProductQueryParams {
  pageNumber?: number;
  pageSize?: number;
  descending?: boolean;
  orderBy?: 'Name' | 'Price' | 'Quantity';
  name?: string;
  categoryIds?: number[];
}
