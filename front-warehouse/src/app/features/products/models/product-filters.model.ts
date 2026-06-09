export interface ProductFilters {
  name?: string;
  categoryIds: number[];
  sort?:
    | ''
    | 'Name_ASC'
    | 'Name_DESC'
    | 'Price_ASC'
    | 'Price_DESC'
    | 'Quantity_ASC'
    | 'Quantity_DESC';
}
