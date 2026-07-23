import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgresRepository } from "../../../src/infrastructure/index.js";
import { Order } from "../../../src/core/index.js";
import { Pool } from "pg";
describe("PostgresRepository integration tests", () => {
    let container: StartedPostgreSqlContainer;
    let pool: Pool;
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

    describe("addOrderAsync", () => {
        it("should sucessfully save order to DB when Order is valid", async () => {
            //Arrange
            const order = Order.create("customer", [{productId: "test", quantity: 2}]);
            //Act
            await sut.saveAsync(order);
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
            await sut.saveAsync(order);
            //Act
            const result = await sut.getByUuidAsync(order.uuid);
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
            const result = await sut.getByUuidAsync(uuid);
            // Assert
            expect(result).toBeNull();
        });
    });

    describe("getPagedAsync", () => {
        it("should return paged results and totalCount when no filters applied", async () => {
            //Arrange
            const order1 = Order.create("Cust1", [{ productId: "prod1", quantity: 1 }]);
            const order2 = Order.create("Cust2", [{ productId: "prod2", quantity: 2 }]);
            const order3 = Order.create("Cust3", [{ productId: "prod3", quantity: 3 }]);
            
            await sut.saveAsync(order1);
            await sut.saveAsync(order2);
            await sut.saveAsync(order3);

            const query = { pageNumber: 1, pageSize: 2, descending: false };
            //Act
            const result = await sut.getPagedAsync(query);
            //Assert
            expect(result.totalCount).toBe(3); 
            expect(result.data).toHaveLength(2); 
        });

        it("should filter correctly by customerId (case-insensitive)", async () => {
            //Arrange
            const order1 = Order.create("JeremyDoe123", [{ productId: "prod1", quantity: 1 }]);
            const order2 = Order.create("JadeSmith1", [{ productId: "prod2", quantity: 2 }]);
            await sut.saveAsync(order1);
            await sut.saveAsync(order2);

            const query = { pageNumber: 1, pageSize: 10, descending: false, customerId: "doe" };
            //Act
            const result = await sut.getPagedAsync(query);
            //Asserts
            expect(result.totalCount).toBe(1);
            expect(result.data[0]!.customerId).toBe("JeremyDoe123");
        });

        it("should filter correctly by partial UUID", async () => {
            //Arrange
            const order = Order.create("Customer", [{ productId: "prod1", quantity: 1 }]);
            await sut.saveAsync(order);

            const partialUuid = order.uuid.substring(0, 5);
            const query = { pageNumber: 1, pageSize: 10, descending: false, uuid: partialUuid };
            //Act
            const result = await sut.getPagedAsync(query);
            //Asserts
            expect(result.totalCount).toBe(1);
            expect(result.data[0]!.uuid).toBe(order.uuid);
        });

        it("should filter correctly by productIds inside JSONB items array", async () => {
            //Arrange
            const order1 = Order.create("Cust1", [{ productId: "XBOX", quantity: 1 }]);
            const order2 = Order.create("Cust2", [{ productId: "PROD2", quantity: 1 }]);
            await sut.saveAsync(order1);
            await sut.saveAsync(order2);
            const query = { pageNumber: 1, pageSize: 10, descending: false, productIds: ["XBOX"] };
            //Act
            const result = await sut.getPagedAsync(query);
            //Asserts
            expect(result.totalCount).toBe(1);
            expect(result.data[0]!.items[0]!.productId).toBe("XBOX");
        });

        it("should sort results correctly by customerId descending", async () => {
            //Arrange
            const order1 = Order.create("AAA", [{ productId: "p1", quantity: 1 }]);
            const order2 = Order.create("CCC", [{ productId: "p2", quantity: 2 }]);
            const order3 = Order.create("BBB", [{ productId: "p3", quantity: 3 }]);
            
            await sut.saveAsync(order1);
            await sut.saveAsync(order2);
            await sut.saveAsync(order3);

            const query = { pageNumber: 1, pageSize: 10, descending: true, orderBy: "customerId" };
            //Act
            const result = await sut.getPagedAsync(query);
            //Asserts
            expect(result.data).toHaveLength(3);
            expect(result.data[0]!.customerId).toBe("CCC"); 
            expect(result.data[1]!.customerId).toBe("BBB"); 
            expect(result.data[2]!.customerId).toBe("AAA"); 
        });

        it("should return empty result when no orders match filters", async () => {
            const order = Order.create("Cust", [{ productId: "p1", quantity: 1 }]);
            await sut.saveAsync(order);

            const query = { pageNumber: 1, pageSize: 10, descending: false, customerId: "NotExisting" };
            //Act
            const result = await sut.getPagedAsync(query);
            //Asserts
            expect(result.totalCount).toBe(0);
            expect(result.data).toHaveLength(0);
        });
    });

    describe("getByUuidAsync", () => {
        it("should successfully get order from DB when Order exists", async () => {
            //Arrange
            const order = Order.create("customer", [{productId: "test", quantity: 2}]);
            await sut.saveAsync(order);
            //Act
            const result = await sut.getByUuidAsync(order.uuid);
            //Asserts
            expect(result).not.toBeNull();
            expect(result?.uuid).toStrictEqual(order.uuid);
            expect(result?.customerId).toStrictEqual(order.customerId);
            expect(result?.items).toStrictEqual(order.items);
            expect(result?.created_at).toStrictEqual(order.created_at);
        });

        it("should return null when order with given UUID does not exist", async () => {
            //Arrange
            const uuid = "00000000-0000-0000-0000-000000000000";
            //Act
            const result = await sut.getByUuidAsync(uuid);
            //Asserts
            expect(result).toBeNull();
        });

        it("should throw an error when provided UUID is invalid and Postgres rejects it", async () => {
            //Arrange
            const invalidUuid = "not-a-real-uuid"; 
            
            //Act && Asserts
            await expect(sut.getByUuidAsync(invalidUuid)).rejects.toThrow();
        });
    });
});