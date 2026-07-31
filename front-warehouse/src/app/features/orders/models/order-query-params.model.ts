export interface OrderQueryParams {
  pageNumber?: number;
  pageSize?: number;
  descending?: boolean;
  orderBy?: SortColumn;
  customerId?: string;
  productsId?: string[];
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

export type SortColumn = 'CreatedAt' | 'CustomerId';
export type SortDirection = 'asc' | 'desc';
