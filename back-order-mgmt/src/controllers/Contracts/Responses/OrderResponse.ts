import type { OrderItemDto } from "../Requests/CreateOrderRequest.js";

export interface OrderResponse {
    uuid: string;
    customerId: string;
    items: OrderItemDto[];
    createdAt: Date;
}

export interface PagedOrderResponse {
    totalCount: number;
    data: OrderResponse[];
}