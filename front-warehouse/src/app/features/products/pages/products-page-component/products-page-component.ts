import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductCardComponent } from '@features/products/components/product-card-component/product-card-component';
import { Product } from '@features/products/models/product.model';
import { ProductsService } from '@features/products/services/products-service';
import { ProductTableComponent } from '@features/products/components/product-table-component/product-table-component';

@Component({
  selector: 'app-products-page-component',
  imports: [ProductCardComponent, ProductTableComponent],
  standalone: true,
  templateUrl: './products-page-component.html',
  styleUrl: './products-page-component.scss',
})
export class ProductsPageComponent implements OnInit {
  private productsService = inject(ProductsService);

  products = signal<Product[]>([]);
  //products = toSignal(this.productsService.getAllProducts(), { initialValue: [] });

  ngOnInit(): void {
    this.productsService.getAllProducts().subscribe((products) => {
      this.products.set(products);
    });
  }
}
