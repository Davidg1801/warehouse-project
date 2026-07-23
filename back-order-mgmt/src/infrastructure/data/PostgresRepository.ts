import type { Pool } from "../../../node_modules/@types/pg/index.js";
import type { Order } from "../../core/Entities/Order.js";
import type{ IOrderRepository } from "../../core/Interfaces/IOrderRepository.js";
import type { OrderQuery } from "../../core/Queries/OrderQuery.js";
import type { PagedResult } from "../../core/Results/PagedResult.js";

export class PostgresRepository implements IOrderRepository {

    constructor (private readonly pool : Pool){};

    async getPagedAsync(query: OrderQuery): Promise<PagedResult<Order>> {
        try {
            const values: any[] = [];
            let filters = "";

            //filters
            if (query.customerId) {
                values.push(`%${query.customerId}%`);
                filters += ` AND Data->>'customerId' ILIKE $${values.length}`;
            }

            if (query.uuid) {
                values.push(`%${query.uuid}%`);
                filters += ` AND Uuid::text ILIKE $${values.length}`;
            }

            if (query.productIds && query.productIds.length > 0) {
                values.push(query.productIds);
                filters += ` AND EXISTS (
                    SELECT 1 FROM jsonb_array_elements(Data->'items') AS item 
                    WHERE item->>'productId' = ANY($${values.length})
                )`;
            }

            if (query.dateFrom) {
                values.push(query.dateFrom);
                filters += ` AND (Data->>'created_at')::timestamp >= $${values.length}::timestamp`;
            }

            if (query.dateTo) {
                values.push(query.dateTo);
                filters += ` AND (Data->>'created_at')::timestamp <= $${values.length}::timestamp`;
            }

            //totalCount
            const countSql = `SELECT count(*) FROM Orders WHERE 1=1 ${filters}`;
            const countResult = await this.pool.query(countSql, values);
            const totalCount = parseInt(countResult.rows[0].count, 10);

            if (totalCount === 0) {
                return { totalCount: 0, data: [] };
            }
            //Sort
            const allowedSortColumns = ["createdAt", "customerId"];
            const sortColumn = allowedSortColumns.includes(query.orderBy || "") ? query.orderBy : "createdAt";
            const direction = query.descending ? "DESC" : "ASC";

            let sortClause = "";
            if (sortColumn === "customerId") {
                sortClause = ` ORDER BY LOWER(Data->>'customerId') ${direction}`;
            } else {
                sortClause = ` ORDER BY (Data->>'created_at')::timestamp ${direction}`;
            }

            const dataValues = [...values];
            //offset
            dataValues.push(query.pageSize);
            const limitIndex = dataValues.length;

            const offset = (query.pageNumber - 1) * query.pageSize;
            dataValues.push(offset);
            const offsetIndex = dataValues.length;

            const paginationClause = ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;

            //execute
            const dataSql = `SELECT Data FROM Orders WHERE 1=1 ${filters} ${sortClause} ${paginationClause}`;
            const dataResult = await this.pool.query(dataSql, dataValues);

            const orders: Order[] = dataResult.rows.map(row => {
                const orderData = row.data;
                orderData.created_at = new Date(orderData.created_at);
                return orderData as Order;
            });

            return {
                totalCount,
                data: orders
            };

        } catch (error) {
            console.error("Error fetching orders by query from Postgres:", error);
            throw error;
        }
    }

    async saveAsync(order: Order): Promise<void> {
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
    async getByUuidAsync(uuid: string): Promise<Order | null> {
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