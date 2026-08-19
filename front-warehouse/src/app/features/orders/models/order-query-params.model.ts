import { SortState } from '@shared/models/sort.model';

export interface OrderQueryParams {
  pageNumber?: number;
  pageSize?: number;
  descending?: boolean;
  orderBy?: OrderSortColumn;
  customerId?: string;
  uuid?: string;
  productName?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export type OrderSortState = SortState<OrderSortColumn>;
export type OrderSortColumn = 'CreatedAt' | 'CustomerId' | 'TotalPrice';
