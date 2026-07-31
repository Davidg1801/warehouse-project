export interface OrderDto {
  uuid: string;
  customerId: string;
  items: OrderItemDto[];
  createdAt: string;
}

export interface CreateOrderDto {
  customerId: string;
  items: OrderItemDto[];
}

export interface OrderItemDto {
  productId: string;
  quantity: number;
  unitPrice?: number;
}
