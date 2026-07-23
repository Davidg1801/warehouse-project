import type { Order, OrderItem } from "../Entities/Order.js";
import type { OrderQuery } from "../Queries/OrderQuery.js";
import type { PagedResult } from "../Results/PagedResult.js";

export interface IOrderService {
    addOrderAsync(customerId: string, items: OrderItem[]) : Promise<Order>;

    getOrderAsync(uuid: string) : Promise<Order |null >;

    getAllOrderAsync(orderQuery : OrderQuery) : Promise<PagedResult<Order>>;
}