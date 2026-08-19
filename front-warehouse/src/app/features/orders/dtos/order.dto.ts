export interface OrderDto {
  uuid: string;
  customerId: string;
  items: OrderItemDto[];
  totalPrice: number;
  createdAt: string;
}

export interface OrderItemDto {
  productId: string;
  quantity: number;
  name: string;
  pricePerUnit: number;
}
