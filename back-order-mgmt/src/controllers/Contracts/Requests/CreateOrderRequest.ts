export interface OrderItemDto {
    productId: string;
    quantity: number;
    name: string;
}

export interface CreateOrderRequest {
    customerId: string;
    items: OrderItemDto[];
}