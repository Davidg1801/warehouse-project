import type { Pool } from "../../../node_modules/@types/pg/index.js";
import type { Order } from "../../core/Entities/Order.js";
import type{ IOrderRepository } from "../../core/Interfaces/IOrderRepository.js";

export class PostgresRepository implements IOrderRepository {

    constructor (private readonly pool : Pool){};

    async save(order: Order): Promise<void> {
        try {
            const orderJson : string = JSON.stringify(order);
            const values : string[] = [order.uuid, orderJson];
            const script : string = "INSERT INTO Orders (Uuid, Data) VALUES ($1, $2);";
            await this.pool.query(script, values);
        } catch (error) {
            console.error("Error saving order to Postgres:", error);
            throw error;
        } 
    }   
    async getByUuid(uuid: string): Promise<Order | null> {
        try {
            const script : string = "SELECT Data FROM Orders WHERE Uuid = $1;";
            const result = await this.pool.query(script, [uuid]);
            if (result.rows.length === 0) {
                return null;
            }

            const orderData = result.rows[0].data;

            orderData.created_at = new Date(orderData.created_at);
            return orderData as Order;
            
        } catch (error) {
            console.error("Error fetching order by UUID from Postgres:", error);
            throw error;
        } 
    }
}