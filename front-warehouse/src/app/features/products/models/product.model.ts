export interface Product {
  uuid: string;
  name: string;
  categoryId: number;
  categoryName?: string;
  price: number;
  quantity: number;
}
