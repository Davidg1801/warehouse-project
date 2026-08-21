import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { PaginationComponent } from '@shared/components/pagination/pagination.component/pagination.component';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { OrdersService } from '@features/orders/services/orders.service';
import { mapRouteToOrderQueryParams } from '@features/orders/mappers/route-to-query-param.mapper';
import { map } from 'rxjs';
import { Order, OrderFilters } from '@features/orders/models/order.model';
import { OrderTableComponent } from '@features/orders/components/order-table/order-table.component/order-table.component';
import { OrderFiltersComponent } from '@features/orders/components/order-filters/order-filters.component/order-filters.component';
import { Pagination } from '@shared/models/pagination.model';
import { OrderDetailsComponent } from '@features/orders/components/order-details/order-details.component/order-details.component';
import { OrderSortColumn, OrderSortState } from '@features/orders/models/order-query-params.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      return this.orderService.getAllOrders(params);
    },
  });

  readonly orders = computed(() => this.ordersResource.value()?.data ?? []);

  private updateQueryParams(queryParams: Params): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  // ---- PAGINATION ---- //
  readonly totalCount = computed(() => this.ordersResource.value()?.totalCount ?? 0);
  readonly totalPages = computed(() => this.ordersResource.value()?.totalPages ?? 0);
  readonly pageNumber = computed(() => Number(this.queryParams()['pageNumber']) || 1);
  readonly pageSize = computed(() => Number(this.queryParams()['pageSize']) || 10);

  onPageChanged(pageNumber: number): void {
    this.updateQueryParams({ pageNumber });
  }

  onPageSizeChanged(pageState: Pagination): void {
    this.updateQueryParams({ pageNumber: pageState.pageNumber, pageSize: pageState.pageSize });
  }

  // ---- SORTING ---- //
  readonly sortState = computed<OrderSortState>(() => {
    const params = this.queryParams();
    const isDescParam = params['descending'];
    return {
      column: (params['orderBy'] as OrderSortColumn) ?? 'CreatedAt',
      direction: isDescParam === 'false' || isDescParam === false ? 'asc' : 'desc',
    };
  });

  onSortChange(newSort: OrderSortState): void {
    this.updateQueryParams({
      orderBy: newSort.column,
      descending: newSort.direction === 'desc',
      pageNumber: 1,
    });
  }

  // ---- FILTERS ---- //
  readonly activeFilters = toSignal<OrderFilters>(
    this.route.queryParams.pipe(
      map((params) => ({
        dateFrom: params['dateFrom'] ?? null,
        dateTo: params['dateTo'] ?? null,
        orderId: params['uuid'] ?? null,
        customerId: params['customerId'] ?? null,
        productName: params['productName'] ?? null,
      })),
    ),
  );

  onFiltersChange(filters: OrderFilters): void {
    this.updateQueryParams({
      dateFrom: filters.dateFrom || null,
      dateTo: filters.dateTo || null,
      uuid: filters.orderId || null,
      customerId: filters.customerId || null,
      productName: filters.productName || null,
      pageNumber: 1,
    });
  }

  // ---- ORDER DETAILS ---- //
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
