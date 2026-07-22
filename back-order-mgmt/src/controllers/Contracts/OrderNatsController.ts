import { StringCodec, type NatsConnection, type Subscription } from "nats";
import type { IOrderController } from "./Interfaces/IOrderController.js";
import type { IOrderService } from "../../core/Interfaces/IOrderService.js";
import type { CreateOrderRequest } from "./Requests/CreateOrderRequest.js";
import type { OrderResponse } from "./Responses/OrderResponse.js";

export class OrderNatsController implements IOrderController {
    
    private readonly sc = StringCodec();

    constructor( private readonly nc: NatsConnection, private readonly orderService : IOrderService) {};

    public async startListening(): Promise<void> {
        
        console.log(`[NATS Controller] Start Listeners`);

        await Promise.all([this.listenForCreateOrder()]);
    }

    private async listenForCreateOrder() : Promise<void> {
        const subject = "orders.create";
        const sub: Subscription = this.nc.subscribe(subject);
        console.log(`[NATS] Listen on topic: ${subject}`);
        for await (const msg of sub) {
            try {
                const payloadString = this.sc.decode(msg.data);
                const request: CreateOrderRequest = JSON.parse(payloadString);

                console.log(`[NATS] Customer no. : ${request.customerId} try create new order`);

                const createdOrder = await this.orderService.addOrder(request.customerId, request.items);
                const responseDto: OrderResponse = {
                    uuid: createdOrder.uuid,
                    customerId: createdOrder.customerId,
                    items: createdOrder.items,
                    createdAt: createdOrder.created_at
                };
                const responseJson = JSON.stringify(responseDto);
                msg.respond(this.sc.encode(responseJson));
                
            } catch (error) {
                console.error(`[NATS] Error during creating order: ${error}`);
                const errorMessage = error instanceof Error ? error.message : "Anyknow error";
                msg.respond(this.sc.encode(`ERROR: ${errorMessage}`));
            }
        }
    }

    private async listenForGetOrder() : Promise<void> {
        const subject = "orders.get";
        const sub: Subscription = this.nc.subscribe(subject);
        console.log(`[NATS] Listen on topic: ${subject}`);
        for await (const msg of sub) {
            try {
                const uuid = this.sc.decode(msg.data);

                console.log(`[NATS] Received request:: orders.get for UUID: ${uuid} `);

                const order = await this.orderService.getOrder(uuid);
                if (order) {
                    const responseDto: OrderResponse = {
                        uuid: order.uuid,
                        customerId: order.customerId,
                        items: order.items,
                        createdAt: order.created_at
                    };
                    const responseJson = JSON.stringify(responseDto);
                    msg.respond(this.sc.encode(responseJson));
                } else {
                    msg.respond(this.sc.encode("ERROR: Order not found"));
                }
            } catch (error) {
                console.error(`[NATS] Error during getting order": ${error}`);
                const errorMessage = error instanceof Error ? error.message : "Anyknow error";
                msg.respond(this.sc.encode(`ERROR: ${errorMessage}`));
            }
        }
    }

}