export interface Order {
  uuid: string;
  orderNr: string;
  customerId: string;
  createdAt: string;
  totalPrice: number;
  items: OrderItem[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderFilters {
  dateFrom: string | null;
  dateTo: string | null;
  customerId: string | null;
  productsId: string | null;
}
