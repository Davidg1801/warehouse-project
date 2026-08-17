import {v4 as uuidv4} from 'uuid';

export interface OrderItem {
    productId: string;
    quantity: number;
    pricePerUnit: number;
    name: string;
}

export class Order {
    public readonly uuid: string;
    public readonly customerId: string;
    public readonly items: OrderItem[];
    public readonly totalPrice: number;
    public readonly created_at: Date;

    private constructor(
        uuid: string,
        customerId: string,
        items: OrderItem[],
        totalPrice: number,
        created_at: Date
    ) {
        this.uuid = uuid;
        this.customerId = customerId;
        this.items = items;
        this.totalPrice = totalPrice;
        this.created_at = created_at;
    }

    public static create(customerId: string, items: OrderItem[]): Order {
        if (!customerId) {
            throw new Error("Customer ID is required.");
        }
        
        if (!items || items.length === 0) {
            throw new Error("Order must contain at least one item.");
        }
        
        let calculatedTotalPrice = 0;
        for (const item of items) {
            if (item.quantity <= 0) {
                throw new Error(`Invalid quantity for product ${item.productId}: quantity must be greater than zero.`);
            }

            if (item.pricePerUnit == null || item.pricePerUnit < 0) {
                throw new Error(`Invalid price for product ${item.productId}: price cannot be negative.`);
            }

            calculatedTotalPrice += item.quantity * item.pricePerUnit;
        }

        return new Order(
            uuidv4(),
            customerId,
            items.map(item => ({ ...item })),
            calculatedTotalPrice,
            new Date()
        );
    }

}