export interface PagedResult<T> {
    totalCount: number;
    data: T[];
}