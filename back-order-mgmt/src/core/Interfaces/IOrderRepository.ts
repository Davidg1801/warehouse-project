import type { Order } from "../Entities/Order.js";
import type { OrderQuery } from "../Queries/OrderQuery.js";
import type { PagedResult } from "../Results/PagedResult.js";
export interface IOrderRepository {
    saveAsync(order : Order) : Promise<void>;
    getByUuidAsync(uuid : string): Promise< Order | null>;
    getPagedAsync(query : OrderQuery): Promise<PagedResult<Order>>;
}