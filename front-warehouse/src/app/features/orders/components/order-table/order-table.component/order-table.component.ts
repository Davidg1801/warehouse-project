import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import {
  SortColumn,
  SortDirection,
  SortState,
} from '@features/orders/models/order-query-params.model';
import { Order } from '@features/orders/models/order.model';

@Component({
  selector: 'app-order-table',
  imports: [DatePipe, CurrencyPipe],
  templateUrl: './order-table.component.html',
  styleUrl: './order-table.component.scss',
})
export class OrderTableComponent {
  readonly orders = input.required<Order[]>();
  readonly currentSort = input<SortState>({ column: 'CreatedAt', direction: 'desc' });

  readonly orderSelected = output<Order>();
  readonly sortChange = output<SortState>();

  toggleSort(column: SortColumn): void {
    console.log('toggleSort: ', column);
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
