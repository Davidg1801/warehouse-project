export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  errors: string[] | null;
  data: T;
}
