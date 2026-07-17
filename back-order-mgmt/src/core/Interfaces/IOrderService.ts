import type { Order, OrderItem } from "../Entities/Order.js";

export interface IOrderService {
    addOrder(customerId: string, items: OrderItem[]) : Promise<Order>;
}