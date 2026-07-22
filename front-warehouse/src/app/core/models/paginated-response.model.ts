import { ApiResponse } from './api-response.model';

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
}
