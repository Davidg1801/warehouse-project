import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Order } from '@features/orders/models/order.model';

@Component({
  selector: 'app-order-details',
  imports: [CurrencyPipe, DatePipe],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss',
})
export class OrderDetailsComponent {
  selectedOrder = input.required<Order | null>();
  readonly closeOrderDetails = output<void>();
}
