export interface ProductQueryParams {
  pageNumber: number;
  pageSize: number;
  orderBy?: 'Name' | 'Price' | 'Quantity';
  descending?: boolean;
  name?: string;
  categoryIds?: number[];
}
