//Is not used because backend was changed

// import { OrderDto, OrderItemDto } from '../dtos/order.dto';
// import { Order, OrderItem } from '../models/order.model';

// function mapOrderItemDtoToUI(dto: OrderItemDto): OrderItem {
//   return {
//     productId: dto.productId,
//     productName: dto.name,
//     quantity: dto.quantity,
//     unitPrice: dto.pricePerUnit,
//   };
// }

// function mapOrderDtoToUI(dto: OrderDto): Order {
//   const items = dto.items.map(mapOrderItemDtoToUI);
//   const totalPrice = items.reduce(
//     (acc, item) => (item.unitPrice ? acc + item.quantity * item.unitPrice : 0),
//     0,
//   );

//   return {
//     uuid: dto.uuid,
//     orderNr: dto.uuid,
//     customerId: dto.customerId,
//     createdAt: dto.createdAt,
//     items: items,
//     totalPrice,
//   };
// }

// export function mapOrdersDtoToUI(dtos: OrderDto[]): Order[] {
//   return dtos.map(mapOrderDtoToUI);
// }
