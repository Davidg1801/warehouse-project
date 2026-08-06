import { type Msg, type NatsConnection, StringCodec, type Subscription } from "nats";
import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";
import { Order, type IOrderService } from "../../src/core/index.js";
import { OrderNatsController } from "../../src/controllers/index.js";


async function* mockSingleMessageStream<T>(payload: T): AsyncIterable<T> {
    yield payload;
}
async function* mockEmptyStream<T>(): AsyncIterable<T> {
}

describe("OrderNatsController", () => {
    const sc = StringCodec();
    it("should successfully process orders.add message and respond with JSON", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();
        const requestDto = { customerId: "customer", items: [ {productId: "product", quantity: 2, name: "prod"} ]};
        
        mockMsg.data = sc.encode(JSON.stringify(requestDto));
        mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.add") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });

        mockNc.request.mockImplementation(async (subject: string) => {
            const mockReply = mock<Msg>();
            if (subject === "products.reserve") {
                mockReply.data = sc.encode(JSON.stringify({ success: true }));
            } else if (subject === "products.get") {
                mockReply.data = sc.encode(JSON.stringify({ name: "Product" }));
            }
            return mockReply;
        });
        const expectedItems = [{ productId: "product", quantity: 2, name: "Product" }];
        const order = Order.create(requestDto.customerId, expectedItems);
        mockOrderService.addOrderAsync.mockResolvedValue(order);
    
        const sut = new OrderNatsController(mockNc, mockOrderService);
        //Act
        await sut.startListening();
        //Assert
        expect(mockNc.request).toHaveBeenCalledWith("products.reserve", expect.any(Uint8Array), { timeout: 5000 });
        expect(mockOrderService.addOrderAsync).toHaveBeenCalledWith(requestDto.customerId, expectedItems);
        expect(mockMsg.respond).toHaveBeenCalledOnce();

        const calls = (mockMsg.respond as any).mock.calls;
        const respondArg = calls[0][0];
        const responseString = sc.decode(respondArg as Uint8Array);
        const responseObject = JSON.parse(responseString);

        expect(responseObject.uuid).toBe(order.uuid);
        expect(responseObject.customerId).toBe(requestDto.customerId);
        expect(responseObject.createdAt).toBeDefined();
        expect(responseObject.items).toHaveLength(1);
        expect(responseObject.items[0].productId).toBe("product");
    });

    it("should process orders.add message and return ERROR when product reservation fails", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();
        const requestDto = { customerId: "customer", items: [{ productId: "product", quantity: 2 }] };
        
        mockMsg.data = sc.encode(JSON.stringify(requestDto));
        mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.add") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });

        const mockReserveReply = mock<Msg>();
        mockReserveReply.data = sc.encode(JSON.stringify({ success: false, errors: ["Insufficient stock"] }));
        mockNc.request.mockResolvedValue(mockReserveReply);

        const sut = new OrderNatsController(mockNc, mockOrderService);
        
        //Act
        await sut.startListening();
        
        // Assert
        expect(mockNc.request).toHaveBeenCalledWith("products.reserve", expect.any(Uint8Array), { timeout: 5000 });
        expect(mockOrderService.addOrderAsync).not.toHaveBeenCalled(); 
        
        const calls = (mockMsg.respond as any).mock.calls;
        const respondArg = calls[0][0];
        const responseString = sc.decode(respondArg as Uint8Array);
        
        expect(responseString).toBe("ERROR: Insufficient stock");
    });

    it("should process orders.add message and return ERROR when database throws exception during save", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();
        const requestDto = { customerId: "customer", items: [{ productId: "product", quantity: 2 }] };

        mockMsg.data = sc.encode(JSON.stringify(requestDto));
        mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.add") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });

        const mockReserveReply = mock<Msg>();
        mockReserveReply.data = sc.encode(JSON.stringify({ success: true }));
        mockNc.request.mockResolvedValue(mockReserveReply);

        const errorMessage = "Database connection lost";
        mockOrderService.addOrderAsync.mockRejectedValue(new Error(errorMessage));
        const sut = new OrderNatsController(mockNc, mockOrderService);

        //Act
        await sut.startListening();

        // Assert
        expect(mockNc.request).toHaveBeenCalled();
        const calls = (mockMsg.respond as any).mock.calls;
        const respondArg = calls[0][0];
        const responseString = sc.decode(respondArg as Uint8Array);
        expect(responseString).toBe(`ERROR: ${errorMessage}`);
    });

    it("should successfully process orders.get message and respond with Order Json", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();
        const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
        mockMsg.data = sc.encode(targetUuid);
        mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.get") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });
        const order = Order.create("cust1", [{productId: "prod1", quantity: 2, name: "Prod1"}]);
        (order as any).uuid = targetUuid;
        mockOrderService.getOrderAsync.mockResolvedValue(order);
        const sut = new OrderNatsController(mockNc, mockOrderService);
        //Act
        await sut.startListening();
        //Assert
        expect(mockOrderService.getOrderAsync).toHaveBeenCalledExactlyOnceWith(targetUuid);
        const calls = (mockMsg.respond as any).mock.calls;
        const respondArg = calls[0][0];
        const responseString = sc.decode(respondArg as Uint8Array);
        const responseObject = JSON.parse(responseString);
        expect(responseObject.uuid).toBe(targetUuid);
        expect(responseObject.customerId).toBe("cust1");
        expect(responseObject.items.length).toBe(1);
        expect(responseObject.createdAt).toBeDefined();
    });

    it("should process orders.get message and return ERROR when order does not exist", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();
        const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
        mockMsg.data = sc.encode(targetUuid);
        mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.get") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });
        
        mockOrderService.getOrderAsync.mockResolvedValue(null);
        const sut = new OrderNatsController(mockNc, mockOrderService);
        //Act
        await sut.startListening();
        //Assert
        expect(mockOrderService.getOrderAsync).toHaveBeenCalledExactlyOnceWith(targetUuid);
        const calls = (mockMsg.respond as any).mock.calls;
        const respondArg = calls[0][0];
        const responseString = sc.decode(respondArg as Uint8Array);
        expect(responseString).toBe("ERROR: Order not found");
    });

    it("should process orders.get message and return ERROR when appear connection problem", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();
        const targetUuid = "123e4567-e89b-12d3-a456-426614174000";
        mockMsg.data = sc.encode(targetUuid);
        mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.get") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });
        const errorMessage = "Connection problem";
        mockOrderService.getOrderAsync.mockRejectedValue(new Error(errorMessage));
        const sut = new OrderNatsController(mockNc, mockOrderService);
        //Act
        await sut.startListening();
        //Assert
        expect(mockOrderService.getOrderAsync).toHaveBeenCalledExactlyOnceWith(targetUuid);
        const calls = (mockMsg.respond as any).mock.calls;
        const respondArg = calls[0][0];
        const responseString = sc.decode(respondArg as Uint8Array);
        expect(responseString).toBe(`ERROR: ${errorMessage}`);
    });

    it("should successfully process orders.getall message and handle default values", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();

        const requestDto = { customerId: "test"};
        mockMsg.data = sc.encode(JSON.stringify(requestDto));
        mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.getall") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });
        const order = Order.create("test", [{productId: "prod1", quantity: 2, name: "test1"}]);
        mockOrderService.getAllOrderAsync.mockResolvedValue( { totalCount: 1, data: [order]});
        const sut = new OrderNatsController(mockNc, mockOrderService);
        //Act
        await sut.startListening();
        //Asserts
        expect(mockOrderService.getAllOrderAsync).toHaveBeenCalledWith(expect.objectContaining({pageNumber: 1, pageSize: 10, descending: false, orderBy: "createdAt", customerId: "test"}));
        const calls = (mockMsg.respond as any).mock.calls;
        const respondArg = calls[0][0];
        const responseString = sc.decode(respondArg as Uint8Array);
        const responseObject = JSON.parse(responseString);
        expect(responseObject.data).toHaveLength(1);
        expect(responseObject.totalCount).toBe(1);
        expect(responseObject.data[0].customerId).toBe("test");
        expect(responseObject.data[0].items[0].productId).toBe("prod1");
        expect(responseObject.data[0].createdAt).toBeDefined();
        expect(responseObject.data[0].created_at).toBeUndefined();
    });

    it("should process orders.getall message and return ERROR when exception occurs", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();
        
        mockMsg.data = sc.encode(JSON.stringify({}));
        mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.getall") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });

        const errorMessage = "Cannot fetch orders";
        mockOrderService.getAllOrderAsync.mockRejectedValue(new Error(errorMessage));
        
        const sut = new OrderNatsController(mockNc, mockOrderService);
        
        //Act
        await sut.startListening();
        
        //Assert
        const calls = (mockMsg.respond as any).mock.calls;
        const respondArg = calls[0][0];
        const responseString = sc.decode(respondArg as Uint8Array);
        expect(responseString).toBe(`ERROR: ${errorMessage}`);
    });

    it("should successfully process orders.getall message and map exact query parameters", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();

        const requestDto = { 
            pageNumber: 3, 
            pageSize: 50, 
            descending: true, 
            orderBy: "customerId" 
        };
        mockMsg.data = sc.encode(JSON.stringify(requestDto));
        
        mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.getall") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });
        
        mockOrderService.getAllOrderAsync.mockResolvedValue( { totalCount: 0, data: []});
        const sut = new OrderNatsController(mockNc, mockOrderService);
        
        //Act
        await sut.startListening();
        
        //Asserts
        expect(mockOrderService.getAllOrderAsync).toHaveBeenCalledWith(expect.objectContaining({
            pageNumber: 3, 
            pageSize: 50, 
            descending: true, 
            orderBy: "customerId"
        }));
    });
});