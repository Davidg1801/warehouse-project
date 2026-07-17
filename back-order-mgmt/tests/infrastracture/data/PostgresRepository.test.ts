import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import pg, { Pool } from "../../../node_modules/@types/pg/index.js";
import { PostgresRepository } from "../../../src/infrastructure/index.js";
import { Order } from "../../../src/core/index.js";
describe("PostgresRepository integration tests", () => {
    let container: StartedPostgreSqlContainer;
    let pool: pg.Pool;
    let sut: PostgresRepository;
    beforeAll(async () => {
        container = await new PostgreSqlContainer("postgres:16-alpine").withDatabase("TestWarehouseOrders").withUsername("postgres").withPassword("Test12!sa").start();

        const connectionString = container.getConnectionUri();
        pool = new Pool({ connectionString });

        await pool.query(`
            CREATE TABLE Orders (
                Uuid UUID PRIMARY KEY,
                Data JSONB NOT NULL
            );`
        );

        sut = new PostgresRepository(pool);

    }, 60000);

    beforeEach(async () => {
        await pool.query("TRUNCATE TABLE Orders;");
    })

    afterAll(async () => {
        await pool?.end();
        await container?.stop();
    });

    it("should sucessfully save order to DB when Order is valid", async () => {
        //Arrange
        const order = Order.create("customer", [{productId: "test", quantity: 2}]);
        //Act
        await sut.save(order);
        //Asserts
        const result = await pool.query("SELECT Data from Orders WHERE Uuid = $1", [order.uuid]);
        expect(result.rowCount).toBe(1);
        const orderFromDb : Order = result.rows[0].data;

        expect(orderFromDb.uuid).toStrictEqual(order.uuid);
        expect(orderFromDb.customerId).toStrictEqual(order.customerId);
        expect(orderFromDb.items.length).toBe(order.items.length);
        expect(orderFromDb.items[0]).toStrictEqual(order.items[0]); 
    });

    it("should successfully get order from DB when Order is exist", async () => {
        //Arrange
        const order = Order.create("customer", [{productId: "test", quantity: 2}]);
        await sut.save(order);
        //Act
        const result = await sut.getByUuid(order.uuid);
        //Asserts
        expect(result).not.toBeNull();
        expect(result?.uuid).toStrictEqual(order.uuid);
        expect(result?.customerId).toStrictEqual(order.customerId);
        expect(result?.items).toStrictEqual(order.items);
        expect(result?.created_at).toStrictEqual(order.created_at);

    });

    it("should return null when order with given UUID does not exist", async () => {
        // Arrange
        const uuid = "00000000-0000-0000-0000-000000000000"; 
        // Act
        const result = await sut.getByUuid(uuid);
        // Assert
        expect(result).toBeNull();
    });
});