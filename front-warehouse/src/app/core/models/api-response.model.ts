export interface ApiResponse<T> {
  readonly success: boolean;
  readonly message: string | null;
  readonly errors: string[] | null;
  readonly data: T;
}
