export interface SortState<TColumn = string> {
  column: TColumn;
  direction: SortDirection;
}

export type SortDirection = 'asc' | 'desc';
