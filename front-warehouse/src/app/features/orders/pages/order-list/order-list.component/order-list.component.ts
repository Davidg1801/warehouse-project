import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { PaginationComponent } from '@shared/components/pagination/pagination.component/pagination.component';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { OrdersService } from '@features/orders/services/orders.service';
import { mapRouteToOrderQueryParams } from '@features/orders/mappers/route-to-query-param.mapper';
import { map, of } from 'rxjs';
import { Order, OrderFilters } from '@features/orders/models/order.model';
import { mapOrdersDtoToUI } from '@features/orders/mappers/order.mapper';
import { OrderTableComponent } from '@features/orders/components/order-table/order-table.component/order-table.component';
import { OrderFiltersComponent } from '@features/orders/components/order-filters/order-filters.component/order-filters.component';
import { Pagination } from '@shared/models/pagination.model';
import { OrderDetailsComponent } from '@features/orders/components/order-details/order-details.component/order-details.component';
import { SortColumn, SortState } from '@features/orders/models/order-query-params.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    PaginationComponent,
    OrderTableComponent,
    OrderFiltersComponent,
    OrderDetailsComponent,
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrdersService);
  readonly selectedOrder = signal<Order | null>(null);

  readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  readonly orderQuery = computed(() => {
    return mapRouteToOrderQueryParams(this.queryParams());
  });

  readonly ordersResource = rxResource({
    params: () => this.orderQuery(),
    stream: ({ params }) => {
      return params ? this.orderService.getAllOrders(params) : of(null);
    },
  });

  readonly orders = computed(() => {
    return mapOrdersDtoToUI(this.ordersResource.value()?.data ?? []);
  });

  private updateQueryParams(queryParams: Params): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
  /* PAGINATION */
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalCount = computed(() => this.orders().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));

  onPageChanged(pageNumber: number): void {
    this.updateQueryParams({ pageNumber });
  }

  onPageSizeChanged(pageState: Pagination): void {
    this.updateQueryParams({ pageNumber: pageState.pageNumber, pageSize: pageState.pageSize });
  }

  /* SORTING */
  readonly sortState = computed<SortState>(() => {
    const params = this.queryParams();
    return {
      column: (params['orderBy'] as SortColumn) ?? 'CreatedAt',
      direction: params['descending'] === 'true' || params['descending'] === true ? 'desc' : 'asc',
    };
  });

  onSortChange(newSort: SortState): void {
    this.updateQueryParams({ orderBy: newSort.column, descending: newSort.direction === 'desc' });
  }

  /* FILTERS */
  readonly currentFilters = toSignal<OrderFilters>(
    this.route.queryParams.pipe(
      map((params) => ({
        dateFrom: params['dateFrom'] ?? null,
        dateTo: params['dateTo'] ?? null,
        customerId: params['customerId'] ?? null,
        productsId: params['productId'] ?? null,
      })),
    ),
  );

  onFiltersChange(filters: OrderFilters): void {
    this.updateQueryParams(filters);
  }

  /* ORDER DETAILS */
  selectOrder(order: Order | null): void {
    if (order) {
      if (this.selectedOrder()?.uuid === order.uuid) {
        this.selectedOrder.set(null);
      } else {
        this.selectedOrder.set(order);
      }
    }
  }
}
