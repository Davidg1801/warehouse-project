import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Product } from '@features/products/models/product.model';
import { ProductsService } from '@features/products/services/products-service';
import { ProductTableComponent } from '@features/products/components/product-table-component/product-table-component';
import { CategoriesService } from '@features/categories/services/categories-service';
import { Category } from '@features/products/models/category.model';
import { ProductFiltersComponent } from '@features/products/components/product-filters-component/product-filters-component';
// import { ProductListItem } from '@features/products/view-models/product-list-item.vm';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductPaginationComponent } from '@features/products/components/product-pagination-component/product-pagination-component';
import { ProductQueryParams } from '@features/products/models/product-query-params';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ProductFilters } from '@features/products/models/product-filters.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductVM } from '@features/products/view-models/product-list-item.vm';

@Component({
  selector: 'app-products-page-component',
  imports: [ProductTableComponent, ProductFiltersComponent, RouterLink, ProductPaginationComponent],
  standalone: true,
  templateUrl: './products-page-component.html',
  styleUrl: './products-page-component.scss',
})
export class ProductsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private destroyRef = inject(DestroyRef);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);

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
          const hasOrderBy = !!params['orderBy'];
          const queryParams: ProductQueryParams = {
            pageNumber: params['pageNumber'] ? Number(params['pageNumber']) : 1,
            pageSize: params['pageSize'] ? Number(params['pageSize']) : 10,
            name: params['name'] || undefined,
            orderBy: params['orderBy'] || undefined,
            descending: hasOrderBy ? params['descending'] === 'true' : undefined,
          };

          if (params['categoryIds']) {
            const ids = Array.isArray(params['categoryIds'])
              ? params['categoryIds']
              : [params['categoryIds']];
            queryParams.categoryIds = ids.map((id) => Number(id));
          }

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
    const sortConfig = this.mapSort(filters.sort);

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

  private mapSort(sort?: string) {
    switch (sort) {
      case 'Name_ASC':
        return { orderBy: 'Name', descending: false };
      case 'Name_DESC':
        return { orderBy: 'Name', descending: true };
      case 'Price_ASC':
        return { orderBy: 'Price', descending: false };
      case 'Price_DESC':
        return { orderBy: 'Price', descending: true };
      case 'Quantity_ASC':
        return { orderBy: 'Quantity', descending: false };
      case 'Quantity_DESC':
        return { orderBy: 'Quantity', descending: true };
      default:
        return undefined;
    }
  }

  onDeleteProduct(productId: string): void {
    const confirm = window.confirm('Are you sure you want to delete this product?');
    if (confirm) {
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
