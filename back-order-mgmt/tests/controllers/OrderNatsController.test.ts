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

    it("should successufly process order.create message and respond with JSON", async () => {
        //Arrange
        const mockOrderService = mock<IOrderService>();
        const mockNc = mock<NatsConnection>();
        const mockMsg = mock<Msg>();

        const requestDto = { customerId: "customer", items: [ {productId: "product", quantity: 2} ]};

        mockMsg.data = sc.encode(JSON.stringify(requestDto));
         mockNc.subscribe.mockImplementation((subject: string) => {
            if (subject === "orders.create") {
                return mockSingleMessageStream(mockMsg) as unknown as Subscription;
            }
            return mockEmptyStream() as unknown as Subscription;
        });

        const order = Order.create(requestDto.customerId, requestDto.items);
        mockOrderService.addOrder.mockResolvedValue(order);
    
        const sut = new OrderNatsController(mockNc, mockOrderService);
        //Act
        await sut.startListening();
        //Assert
        expect(mockOrderService.addOrder).toHaveBeenCalledWith(requestDto.customerId, requestDto.items);
        expect(mockMsg.respond).toHaveBeenCalledOnce();

        const calls = (mockMsg.respond as any).mock.calls;
        const respondArg = calls[0][0];
        const responseString = sc.decode(respondArg as Uint8Array);
        const responseObject = JSON.parse(responseString);

        expect(responseObject.uuid).toBe(order.uuid);
        expect(responseObject.customerId).toBe(requestDto.customerId);
    });
});