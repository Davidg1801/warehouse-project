import type { Order } from "../Entities/Order.js";
export interface IOrderRepository {
    save(order : Order) : Promise<void>;
    getByUuid(uuid : string): Promise< Order | null>;
}