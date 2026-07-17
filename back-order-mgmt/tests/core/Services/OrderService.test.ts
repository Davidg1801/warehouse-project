import { mock } from "vitest-mock-extended";
import { describe, it, expect } from "vitest";
import { OrderService, type IOrderRepository, type OrderItem } from "../../../src/core/index.js";

describe("OrderService addOrder" , () => {
    it("should sucessfuly create an order and save it to the repository", async () => {
        //Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);
        const customerId = "customer";
        const items: OrderItem[] = [{productId: "prod1", quantity: 2}];
        //Act
        const result = await sut.addOrder(customerId, items);
        //Arrange
        expect(result).toBeDefined();
        expect(result.customerId).toBe(customerId);

        expect(mockRepository.save).toHaveBeenCalledOnce();
        expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({customerId, items}));
    });

     it('should not call save on repository if order creation fails validation', async () => {
        // Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);
        
        const customerId = ""; 
        const items: OrderItem[] = [{ productId: "prod1", quantity: 2 }];

        // Act & Assert
        await expect(
            sut.addOrder(customerId, items)
        ).rejects.toThrow("Customer ID is required.");

        expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate error if repository.save fails', async () => {
        //Arrange
        const mockRepository = mock<IOrderRepository>();
        const sut = new OrderService(mockRepository);

        const customerId = "customer";
        const items: OrderItem[] = [{productId: "prod1", quantity: 2}];

        mockRepository.save.mockRejectedValue(new Error("DB_CRASHED"));
        //Act Arrange
        await expect(sut.addOrder(customerId, items))
            .rejects.toThrow("DB_CRASHED");
        expect(mockRepository.save).toHaveBeenCalledOnce();
        expect(mockRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                customerId: customerId,
                items: items
            })
        );
    });
});