export interface OrderItemDto {
    productId: string;
    quantity: number;
    pricePerUnit: number;
    name: string;
}

export interface CreateOrderRequest {
    customerId: string;
    items: OrderItemDto[];
}