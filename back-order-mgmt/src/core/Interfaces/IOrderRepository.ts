import type { Order } from "../Entities/Order.js";
import type { OrderQuery } from "../Queries/OrderQuery.js";
import type { PagedResult } from "../Results/PagedResult.js";
export interface IOrderRepository {
    save(order : Order) : Promise<void>;
    getByUuid(uuid : string): Promise< Order | null>;
    getPaged(query : OrderQuery): Promise<PagedResult<Order>>;
}