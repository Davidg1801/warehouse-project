import { describe, it, expect } from "vitest";
import { Order, type OrderItem } from "../../../src/core/index.js";

describe('Create Order Entity', () => {
    it('should create an order when all data is valid', () => {
        //Arrange
        const customerId = "test";
        const items: OrderItem[] = [
            { productId: "prod1", quantity: 2},
            { productId: "prod2", quantity: 1}
        ];
        //Act
        const newOrder = Order.create(customerId, items);
        //Assert
        expect(newOrder).toBeDefined();
        expect(newOrder.customerId).toBeDefined();
        expect(newOrder.customerId).toBe(customerId);
        expect(newOrder.items[0]).toStrictEqual(items[0]);
        expect(newOrder.items[1]).toStrictEqual(items[1]);
        expect(newOrder.items.length).toBe(2);
        expect(newOrder.created_at).toBeDefined();
    });

    it('should throw an error when customerId is empty', () => {
        //Arrange
        const customerId = "";
        const items: OrderItem[] = [
            { productId: "prod1", quantity: 2},
            { productId: "prod2", quantity: 1}
        ];
        //Act
        //Assert
        expect(() => {
            Order.create(customerId, items);
        }).toThrow("Customer ID is required.")
    });

    it('should throw an error when items is empty', () => {
        //Arrange
        const customerId = "customer";
        const items: OrderItem[] = [];
        //Act
        //Assert
        expect(() => {
            Order.create(customerId, items);
        }).toThrow("Order must contain at least one item.")
    });

    it('should throw an error when any item quantity is zero or less', () => {
        //Arrange
        const customerId = "customer";
        const items: OrderItem[] = [
            { productId: "prod1", quantity: 2},
            { productId: "prod2", quantity: 0}
        ];
        //Act
        //Arrange
        expect(() => {
            Order.create(customerId, items);
        }).toThrow("Invalid quantity for product prod2: quantity must be greater than zero.")
    });
});