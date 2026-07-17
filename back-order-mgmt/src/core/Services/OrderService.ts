import type { OrderItem } from "../Entities/Order.js";
import { Order } from "../Entities/Order.js";
import type { IOrderService } from "../Interfaces/IOrderService.js";
import type { IOrderRepository } from '../Interfaces/IOrderRepository.js';

export class OrderService implements IOrderService {
    
    constructor(
        private readonly orderRepository: IOrderRepository
    ){}

    async addOrder(customerId: string, items: OrderItem[]): Promise<Order> {
        const order = Order.create(customerId,items);
        await this.orderRepository.save(order);
        return order;
    }
}