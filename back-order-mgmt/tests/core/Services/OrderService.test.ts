import { mock } from "vitest-mock-extended";
import { describe, it, expect } from "vitest";
import { Order, OrderService, type IOrderRepository, type OrderItem } from "../../../src/core/index.js";
import type { OrderQuery } from "../../../src/core/Queries/OrderQuery.js";
import type { PagedResult } from "../../../src/core/Results/PagedResult.js";

describe("OrderService addOrderAsync" , () => {
    it("should sucessfully create an order and save it to the repository", async () => {
        //Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);
        const customerId = "customer";
        const items: OrderItem[] = [{productId: "prod1", quantity: 2}];
        //Act
        const result = await sut.addOrderAsync(customerId, items);
        //Arrange
        expect(result).toBeDefined();
        expect(result.customerId).toBe(customerId);

        expect(mockRepository.saveAsync).toHaveBeenCalledOnce();
        expect(mockRepository.saveAsync).toHaveBeenCalledWith(expect.objectContaining({customerId, items}));
    });

     it('should not call save on repository if order creation fails validation', async () => {
        // Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);
        
        const customerId = ""; 
        const items: OrderItem[] = [{ productId: "prod1", quantity: 2 }];

        // Act & Assert
        await expect(
            sut.addOrderAsync(customerId, items)
        ).rejects.toThrow("Customer ID is required.");

        expect(mockRepository.saveAsync).not.toHaveBeenCalled();
    });

    it('should propagate error if repository.save fails', async () => {
        //Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);

        const customerId = "customer";
        const items: OrderItem[] = [{productId: "prod1", quantity: 2}];

        mockRepository.saveAsync.mockRejectedValue(new Error("DB_CRASHED"));
        //Act Arrange
        await expect(sut.addOrderAsync(customerId, items))
            .rejects.toThrow("DB_CRASHED");
        expect(mockRepository.saveAsync).toHaveBeenCalledOnce();
        expect(mockRepository.saveAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                customerId: customerId,
                items: items
            })
        );
    });
});

describe("OrderService getOrderAsync" , () => {
    it("should successfully get an order from repository and return it", async () => {
        //Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);
        const customerId = "customer";
        const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
        const items: OrderItem[] = [{productId: "prod1", quantity: 2}];
        const order = Order.create(customerId, items);
        (order as any).uuid = targetUuid;
        mockRepository.getByUuidAsync.mockResolvedValue(order);
        //Act
        const result = await sut.getOrderAsync(targetUuid);
        //Arrange
        expect(result).not.toBeNull();
        expect(result!.uuid).toBe(targetUuid);
        expect(result!.customerId).toBe(customerId);

        expect(mockRepository.getByUuidAsync).toHaveBeenCalledOnce();
        expect(mockRepository.getByUuidAsync).toHaveBeenCalledWith(targetUuid);
    });
    it("should not found order from repository and return null", async () => {
        //Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);
        const customerId = "customer";
        const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
        mockRepository.getByUuidAsync.mockResolvedValue(null);
        //Act
        const result = await sut.getOrderAsync(targetUuid);
        //Arrange
        expect(result).toBeNull();

        expect(mockRepository.getByUuidAsync).toHaveBeenCalledOnce();
        expect(mockRepository.getByUuidAsync).toHaveBeenCalledWith(targetUuid);
    });
    it("should propagate error when repository throws an exception", async () => {
        //Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);
        const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
        const errorMessage = "Database connection dropped";
        mockRepository.getByUuidAsync.mockRejectedValue(new Error(errorMessage));
        
        //Act & Assert
        await expect(sut.getOrderAsync(targetUuid)).rejects.toThrow(errorMessage);

        expect(mockRepository.getByUuidAsync).toHaveBeenCalledOnce();
        expect(mockRepository.getByUuidAsync).toHaveBeenCalledWith(targetUuid);
    });
});

describe("OrderService getAllOrderAsync", () => {
    it("should successfully get paged orders from repository and return them", async () => {
        // Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);
        const query: OrderQuery = {
            pageNumber: 1,
            pageSize: 10,
            descending: true,
            orderBy: "createdAt",
            customerId: "customer"
        };
        const dummyOrder = Order.create("customer", [{ productId: "prod1", quantity: 1 }]);
        const expectedResult: PagedResult<Order> = {
            totalCount: 1,
            data: [dummyOrder]
        };
        mockRepository.getPagedAsync.mockResolvedValue(expectedResult);
        
        // Act
        const result = await sut.getAllOrderAsync(query);
        
        // Assert
        expect(result).toBeDefined();
        expect(result.totalCount).toBe(expectedResult.totalCount);
        expect(result.data).toHaveLength(1);
        expect(result.data[0]!.customerId).toBe("customer");
        expect(mockRepository.getPagedAsync).toHaveBeenCalledOnce();
        expect(mockRepository.getPagedAsync).toHaveBeenCalledWith(query);
    });

    it("should propagate error when repository throws an exception during getting all orders", async () => {
        // Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);    
        const query: OrderQuery = {
            pageNumber: 1,
            pageSize: 10,
            descending: false
        };
        const errorMessage = "Database timeout";
        mockRepository.getPagedAsync.mockRejectedValue(new Error(errorMessage));
        // Act & Assert
        await expect(sut.getAllOrderAsync(query)).rejects.toThrow(errorMessage);
        expect(mockRepository.getPagedAsync).toHaveBeenCalledOnce();
        expect(mockRepository.getPagedAsync).toHaveBeenCalledWith(query);
    });
});