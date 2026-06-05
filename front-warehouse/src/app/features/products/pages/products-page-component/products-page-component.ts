import { Component, inject, OnInit, signal } from '@angular/core';
import { Product } from '@features/products/models/product.model';
import { ProductsService } from '@features/products/services/products-service';
import { ProductTableComponent } from '@features/products/components/product-table-component/product-table-component';
import { CategoriesService } from '@features/categories/services/categories-service';
import { Category } from '@features/categories/models/product.model';
import { ProductFiltersComponent } from '@features/products/components/product-filters-component/product-filters-component';
// import { ProductListItem } from '@features/products/view-models/product-list-item.vm';
import { RouterLink } from '@angular/router';

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
  //products = toSignal(this.productsService.getAllProducts(), { initialValue: [] });
  categories = signal<Category[]>([]);
  //categories = toSignal(this.categoriesService.getAllCategories(), { initialValue: [] });

  ngOnInit(): void {
    // this.productsService.getAllProducts().subscribe((products) => {
    //   this.products.set(products);
    // });

    this.productsService.getProducts().subscribe({
      next: (products) => {
        console.log('OK OK OK');
        console.log(products);
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

  // productsVm = computed<ProductListItem[]>(() => {
  //   const categoriesMap = new Map(this.categories().map((c) => [c.id, c.name]));

  //   return this.products().map((product) => ({
  //     ...product,
  //     categoryName: categoriesMap.get(product.categoryId) ?? 'Other',
  //   }));
  // });
}
