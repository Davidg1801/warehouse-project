import { StringCodec, type NatsConnection, type Subscription } from "nats";
import type { IOrderController } from "./Contracts/Interfaces/IOrderController.js";
import type { IOrderService } from "../core/Interfaces/IOrderService.js";
import type { CreateOrderRequest, OrderItemDto } from "./Contracts/Requests/CreateOrderRequest.js";
import type { OrderResponse } from "./Contracts/Responses/OrderResponse.js";
import { OrderQueryRequest } from "./Contracts/Requests/OrderQueryRequest.js";
import type { OrderQuery } from "../core/Queries/OrderQuery.js";

export class OrderNatsController implements IOrderController {
    
    private readonly sc = StringCodec();

    constructor( private readonly nc: NatsConnection, private readonly orderService : IOrderService) {};

    public async startListening(): Promise<void> {
        
        console.log(`[NATS Controller] Start Listeners`);

        await Promise.all([this.listenForCreateOrder(), this.listenForGetOrder(), this.listenForGetAllOrders()]);
    }

    private async listenForCreateOrder() : Promise<void> {
        const subject = "orders.add";
        const sub: Subscription = this.nc.subscribe(subject);
        console.log(`[NATS] Listen on topic: ${subject}`);
        for await (const msg of sub) {
            try {
                const payloadString = this.sc.decode(msg.data);
                const request: CreateOrderRequest = JSON.parse(payloadString);

                console.log(`[NATS] Customer no. : ${request.customerId} try create new order`);

                console.log(`[NATS] Reserving stock for order...`);
                const reservePayload = JSON.stringify({ items: request.items });
                //console.log(`[NATS] Payload for C# Worker: ${reservePayload}`);
                const reserveReply = await this.nc.request("products.reserve", this.sc.encode(reservePayload), { timeout: 5000 });
                const reserveReplyString = this.sc.decode(reserveReply.data);

                if (reserveReplyString.startsWith("ERROR:")) {
                    msg.respond(this.sc.encode(reserveReplyString));
                    continue; 
                }

                const reserveResult = JSON.parse(reserveReplyString);
                
                const isSuccess = reserveResult.Success ?? reserveResult.success;

                if (!isSuccess) {
                    const errors: string[] = reserveResult.Errors ?? reserveResult.errors ?? ["Unknown stock error"];
                    const combinedErrors = errors.join(" | ");

                    console.log(`[NATS] Stock reservation failed: ${combinedErrors}`);
                    
                    msg.respond(this.sc.encode(`ERROR: ${combinedErrors}`));
                    continue; 
                }
                console.log(`[NATS] Stock reserved successfully. Saving order to database...`);
                const populatedItems: OrderItemDto[] = [];
                for (const item of request.items) {
                    try {
                        const productReply = await this.nc.request(
                            "products.get", 
                            this.sc.encode(item.productId), 
                            { timeout: 3000 }
                        );  
                        const productString = this.sc.decode(productReply.data);
                        if (productString.startsWith("ERROR:")) {
                            throw new Error(`Product ${item.productId} details not found`);
                        }
                        const productInfo = JSON.parse(productString);
                        populatedItems.push({
                            productId: item.productId,
                            quantity: item.quantity,
                            name: productInfo.name ?? productInfo.Name ?? "Unknown Product" 
                        });

                    } catch (err) {
                        console.error(`[NATS] Failed to fetch product info for ${item.productId}:`, err);
                        throw new Error(`Missing product data for ID: ${item.productId}`);
                    }
                }
                const createdOrder = await this.orderService.addOrderAsync(request.customerId, populatedItems);
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

                const order = await this.orderService.getOrderAsync(uuid);
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
                console.error(`[NATS] Error during getting order: ${error}`);
                const errorMessage = error instanceof Error ? error.message : "Anyknow error";
                msg.respond(this.sc.encode(`ERROR: ${errorMessage}`));
            }
        }
    }

    private async listenForGetAllOrders() : Promise<void> {
        const subject = "orders.getall";
        const sub: Subscription = this.nc.subscribe(subject);
        console.log(`[NATS] Listen on topic: ${subject}`);

        for await (const msg of sub) {
            try {
                const stringRequest = this.sc.decode(msg.data);
                const request = new OrderQueryRequest(JSON.parse(stringRequest || "{}"));

                console.log("[NATS] Received request:: orders.getall");
                const query: OrderQuery = {
                    pageNumber: request.pageNumber ?? 1,
                    pageSize: request.pageSize ?? 10,
                    descending: request.descending ?? false,
                    orderBy: request.orderBy ?? "createdAt",
                    customerId: request.customerId ?? undefined,
                    productIds: request.productIds ?? undefined,
                    uuid: request.uuid ?? undefined,
                    productName: request.productName ?? undefined,
                    dateFrom: request.dateFrom ?? undefined,
                    dateTo: request.dateTo ?? undefined
                };
                const ordersPaged = await this.orderService.getAllOrderAsync(query);
                const responseData = ordersPaged.data.map(order => ({
                    uuid: order.uuid,
                    customerId: order.customerId,
                    items: order.items,
                    createdAt: order.created_at
                }));
                const responsePayload = {
                    totalCount: ordersPaged.totalCount,
                    data: responseData
                };
                const response = JSON.stringify(responsePayload);
                msg.respond(this.sc.encode(response));
            } catch (error) {
                console.error(`[NATS] Error during getting orders: ${error}`);
                const errorMessage = error instanceof Error ? error.message : "Anyknow error";
                msg.respond(this.sc.encode(`ERROR: ${errorMessage}`));
            }
        }
    }

}