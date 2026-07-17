export interface OrderItemDto {
    productId: string;
    quantity: number;
}

export interface CreateOrderRequest {
    customerId: string;
    items: OrderItemDto[];
}