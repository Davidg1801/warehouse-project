import type { Order, OrderItem } from "../Entities/Order.js";
import type { OrderQuery } from "../Queries/OrderQuery.js";
import type { PagedResult } from "../Results/PagedResult.js";

export interface IOrderService {
    addOrder(customerId: string, items: OrderItem[]) : Promise<Order>;

    getOrder(uuid: string) : Promise<Order |null >;

    getAllOrder(orderQuery : OrderQuery) : Promise<PagedResult<Order>>;
}