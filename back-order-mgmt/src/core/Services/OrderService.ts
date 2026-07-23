import type { OrderItem } from "../Entities/Order.js";
import { Order } from "../Entities/Order.js";
import type { IOrderService } from "../Interfaces/IOrderService.js";
import type { IOrderRepository } from '../Interfaces/IOrderRepository.js';
import type { OrderQuery } from "../Queries/OrderQuery.js";
import type { PagedResult } from "../Results/PagedResult.js";

export class OrderService implements IOrderService {
    
    constructor(
        private readonly orderRepository: IOrderRepository
    ){}
    async getAllOrderAsync(orderQuery: OrderQuery): Promise<PagedResult<Order>> {
        return await this.orderRepository.getPagedAsync(orderQuery);
    }

    async getOrderAsync(uuid: string): Promise<Order | null> {
        const order = await this.orderRepository.getByUuidAsync(uuid);
        return order ?? null;
    }


    async addOrderAsync(customerId: string, items: OrderItem[]): Promise<Order> {
        const order = Order.create(customerId,items);
        await this.orderRepository.saveAsync(order);
        return order;
    }

}