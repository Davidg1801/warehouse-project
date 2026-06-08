import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Product } from '@features/products/models/product.model';
import { ProductsService } from '@features/products/services/products-service';
import { ProductTableComponent } from '@features/products/components/product-table-component/product-table-component';
import { CategoriesService } from '@features/categories/services/categories-service';
import { Category } from '@features/products/models/category.model';
import { ProductFiltersComponent } from '@features/products/components/product-filters-component/product-filters-component';
// import { ProductListItem } from '@features/products/view-models/product-list-item.vm';
import { RouterLink } from '@angular/router';
import { ProductVM } from '@features/products/view-models/product-list-item.vm';

@Component({
  selector: 'app-products-page-component',
  imports: [ProductTableComponent, ProductFiltersComponent, RouterLink],
  standalone: true,
  templateUrl: './products-page-component.html',
  styleUrl: './products-page-component.scss',
})
export class ProductsPageComponent implements OnInit {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.productsService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.products.set(products);
      },
      error: (err) => {
        console.log('ERROR: ');
        console.log(err);
        console.log('STATUS:', err.status);
        console.log('MESSAGE: ', err.message);
        console.log('ERROR: ', err.error);
      },
    });

    this.categoriesService.getAllCategories().subscribe((categories) => {
      this.categories.set(categories);
    });
  }

  private readonly categoryMap = computed(() => {
    return new Map(this.categories().map((c) => [c.id, c.name]));
  });

  productsVm = computed<ProductVM[]>(() => {
    const map = this.categoryMap();

    return this.products().map((product) => ({
      ...product,
      categoryName: map.get(product.categoryId) ?? 'Unknown',
    }));
  });

  onDeleteProduct(productId: string): void {
    const confirm = window.confirm('Are you sure you want to delete this product?');
    if (confirm) {
      this.productsService.deleteProduct(productId).subscribe(() => {
        this.products.update((products) => products.filter((p) => p.id !== productId));
      });
    }
  }
}
