import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Product } from '@features/products/models/product.model';
import { ProductsService } from '@features/products/services/products.service';
import { ProductTableComponent } from '@features/products/components/product-table/product-table-component';
import { CategoriesService } from '@features/categories/services/categories.service';
import { Category } from '@features/categories/models/category.model';
import { ProductFiltersComponent } from '@features/products/components/product-filters/product-filters-component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductPaginationComponent } from '@features/products/components/product-pagination/product-pagination-component';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ProductFilters } from '@features/products/models/product-filters.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductVM } from '@features/products/view-models/product-list-item.vm';
import { ModalService } from '@shared/services/modal.service';
import { mapRouteToProductQueryParams } from '@features/products/mappers/product-query-params.mapper';
import {
  mapQueryParamsToSort,
  mapSortToQueryParams,
} from '@features/products/mappers/product-sort.mapper';

@Component({
  selector: 'app-products-page-component',
  imports: [ProductTableComponent, ProductFiltersComponent, RouterLink, ProductPaginationComponent],
  standalone: true,
  templateUrl: './products-list-component.html',
  styleUrl: './products-list-component.scss',
})
export class ProductsListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private destroyRef = inject(DestroyRef);
  private modalService = inject(ModalService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);

  activeFilters = signal<ProductFilters>({ name: '', sort: '', categoryIds: [] });

  productsVm = computed<ProductVM[]>(() => {
    const currentProducts = this.products();
    const currentCategories = this.categories();
    return currentProducts.map((product) => {
      const categoryName =
        currentCategories.find((c) => c.id === product.categoryId)?.name || 'Unknown';
      return {
        ...product,
        categoryName: categoryName,
      } as ProductVM;
    });
  });

  ngOnInit(): void {
    this.getCategories();
    this.GetProductsByQueryParams();
  }

  private getCategories() {
    this.categoriesService
      .getAllCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => {
        this.categories.set(categories);
      });
  }

  private GetProductsByQueryParams(): void {
    this.route.queryParams
      .pipe(
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        debounceTime(300),
        switchMap((params) => {
          const queryParams = mapRouteToProductQueryParams(params);
          const sortString = mapQueryParamsToSort(queryParams);

          this.activeFilters.set({
            name: queryParams.name ?? '',
            sort: sortString,
            categoryIds: queryParams.categoryIds ?? [],
          });

          this.pageNumber.set(queryParams.pageNumber!);
          this.pageSize.set(queryParams.pageSize!);

          return this.productsService.getAllProducts(queryParams);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.totalCount.set(response.totalCount);
          this.totalPages.set(response.totalPages);
        },
        error: (err) => console.error('Error while retrieving products:', err),
      });
  }

  onFiltersChanged(filters: ProductFilters) {
    const sortConfig = mapSortToQueryParams(filters.sort);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        name: filters.name || null,
        categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : null,
        orderBy: sortConfig?.orderBy || null,
        descending: sortConfig !== undefined ? sortConfig.descending : null,
        pageNumber: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  async onDeleteProduct(productId: string) {
    const confirmed = await this.modalService.open({
      title: 'Confirm deletion',
      message: 'Are you sure you want to delete this product?',
      confirmLabel: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      this.productsService.deleteProduct(productId).subscribe(() => {
        this.products.update((products) => products.filter((p) => p.uuid !== productId));
      });
    }
  }

  onPageChanged(newPage: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        pageNumber: newPage,
      },
      queryParamsHandling: 'merge',
    });
  }

  onPageSizeChanged(newSize: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        pageSize: newSize,
        pageNumber: 1,
      },
      queryParamsHandling: 'merge',
    });
  }
}
