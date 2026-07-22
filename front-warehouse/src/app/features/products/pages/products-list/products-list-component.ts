import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { Product } from '@features/products/models/product.model';
import { ProductsService } from '@features/products/services/products.service';
import { ProductTableComponent } from '@features/products/components/product-table/product-table-component';
import { CategoriesService } from '@features/categories/services/categories.service';
import { Category } from '@features/categories/models/category.model';
import { ProductFiltersComponent } from '@features/products/components/product-filters/product-filters-component';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { ProductPaginationComponent } from '@features/products/components/product-pagination/product-pagination-component';
import { ProductFilters } from '@features/products/models/product-filters.model';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ModalService } from '@shared/services/modal.service';
import { mapRouteToProductQueryParams } from '@features/products/mappers/product-query-params.mapper';
import {
  mapQueryParamsToSort,
  mapSortToQueryParams,
} from '@features/products/mappers/product-sort.mapper';
import { ProductRankingComponent } from '@features/products/components/product-ranking/product-ranking-component/product-ranking-component';
import { mapProductsWithCategoryNames } from '@features/products/mappers/product-category.mapper';
import { ProductNotificationService } from '@features/products/services/product-notification.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-products-page-component',
  imports: [
    ProductTableComponent,
    ProductFiltersComponent,
    RouterLink,
    ProductPaginationComponent,
    ProductRankingComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products-list-component.html',
  styleUrl: './products-list-component.scss',
})
export class ProductsListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(ModalService);
  private readonly notificationService = inject(ProductNotificationService);

  readonly queryParams = toSignal(this.route.queryParams, {
    initialValue: this.route.snapshot.queryParams,
  });

  readonly productQuery = computed(() => mapRouteToProductQueryParams(this.queryParams()));

  readonly categories: Signal<Category[]> = toSignal(this.categoriesService.getAllCategories(), {
    initialValue: [],
  });

  readonly products = signal<Product[]>([]);
  readonly totalCount = signal(0);
  readonly totalPages = signal(1);
  readonly isLoading = signal(true);

  readonly pageNumber = computed(() => this.productQuery().pageNumber ?? 1);
  readonly pageSize = computed(() => this.productQuery().pageSize ?? 10);

  readonly activeFilters = computed<ProductFilters>(() => ({
    name: this.productQuery().name ?? '',
    sort: mapQueryParamsToSort(this.productQuery()),
    categoryIds: this.productQuery().categoryIds ?? [],
  }));

  readonly productsWithCategories = computed<Product[]>(() =>
    mapProductsWithCategoryNames(this.products(), this.categories()),
  );

  ngOnInit(): void {
    this.loadProducts();
    this.notificationService.startConnection();
    this.listenToRealtimeProductUpdates();
  }

  private loadProducts(): void {
    this.route.queryParams
      .pipe(
        switchMap(() => {
          this.isLoading.set(true);
          return this.productsService.getAllProducts(this.productQuery());
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.totalCount.set(response.totalCount);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Loading products failed', err);
          this.isLoading.set(false);
        },
      });
  }

  private updateQueryParams(queryParams: Params): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  onFiltersChanged(filters: ProductFilters) {
    const sort = mapSortToQueryParams(filters.sort);

    this.updateQueryParams({
      name: filters.name || null,
      categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : null,
      orderBy: sort?.orderBy || null,
      descending: sort?.descending ?? null,
      pageNumber: 1,
    });
  }

  onPageChanged(pageNumber: number): void {
    this.updateQueryParams({ pageNumber });
  }

  onPageSizeChanged(pageSize: number): void {
    this.updateQueryParams({ pageSize });
  }

  async onDeleteProduct(uuid: string): Promise<void> {
    const confirmed = await this.modalService.open({
      title: 'Confirm deletion',
      message: 'Are you sure you want to delete this product?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.productsService
      .deleteProduct(uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.products.update((products) => products.filter((p) => p.uuid !== uuid));
          this.totalCount.update((count) => Math.max(0, count - 1));
        },
        error: (err) => console.error('Error deleting product:', err),
      });
  }

  private listenToRealtimeProductUpdates(): void {
    this.notificationService.productUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updatedProduct: Product) => {
        this.products.update((currentProducts) => {
          const exists = currentProducts.some((product) => product.uuid === updatedProduct.uuid);
          if (!exists) {
            console.log('Product does not exist on this page');
            return currentProducts;
          }
          return currentProducts.map((product) =>
            product.uuid === updatedProduct.uuid ? { ...product, ...updatedProduct } : product,
          );
        });
      });
    this.notificationService.productDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((deletedUuid: string) => {
        this.products.update((currentProducts) => {
          const exists = currentProducts.some((product) => product.uuid === deletedUuid);
          if (!exists) {
            console.log('Product does not exist on this page');
            return currentProducts;
          }
          this.totalCount.update((count) => Math.max(0, count - 1));
          return currentProducts.filter((p) => p.uuid !== deletedUuid);
        });
      });
  }
}
