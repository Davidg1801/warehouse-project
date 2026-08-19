import { Product } from '@features/products/models/product.model';

export interface Order {
  uuid: string;
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  name: string;
  pricePerUnit: number;
}

export interface OrderFilters {
  dateFrom: string | null;
  dateTo: string | null;
  orderId: string | null;
  customerId: string | null;
  productName: string | null;
}

export interface OrderCartItem {
  product: Product;
  quantityToOrder: number;
}
