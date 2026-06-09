import { ApiResponse } from './api-response.model';

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
