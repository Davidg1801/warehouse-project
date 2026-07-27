export interface ProductFilters {
  name?: string;
  categoryIds: number[];
  sort?: ProductSort;
}

export type ProductSort =
  | ''
  | 'Name_ASC'
  | 'Name_DESC'
  | 'Price_ASC'
  | 'Price_DESC'
  | 'Quantity_ASC'
  | 'Quantity_DESC';

export const PRODUCT_SORT_OPTIONS = [
  { value: 'Name_ASC', label: 'Name (A-Z)' },
  { value: 'Name_DESC', label: 'Name (Z-A)' },
  { value: 'Price_ASC', label: 'Price (Low → High)' },
  { value: 'Price_DESC', label: 'Price (High → Low)' },
  { value: 'Quantity_ASC', label: 'Quantity (Low → High)' },
  { value: 'Quantity_DESC', label: 'Quantity (High → Low)' },
] as const;
