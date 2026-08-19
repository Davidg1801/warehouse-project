import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { OrderSortColumn, OrderSortState } from '@features/orders/models/order-query-params.model';
import { Order } from '@features/orders/models/order.model';
import { SortDirection } from '@shared/models/sort.model';

@Component({
  selector: 'app-order-table',
  imports: [DatePipe, CurrencyPipe],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-table.component.html',
  styleUrl: './order-table.component.scss',
})
export class OrderTableComponent {
  readonly orders = input.required<Order[]>();
  readonly currentSort = input<OrderSortState>({ column: 'CreatedAt', direction: 'desc' });

  readonly orderSelected = output<Order>();
  readonly sortChange = output<OrderSortState>();

  toggleSort(column: OrderSortColumn): void {
    const activeSort = this.currentSort();
    let sortDirection: SortDirection = 'asc';

    if (activeSort.column === column)
      sortDirection = activeSort.direction === 'asc' ? 'desc' : 'asc';

    this.sortChange.emit({
      column: column,
      direction: sortDirection,
    });
  }
}
