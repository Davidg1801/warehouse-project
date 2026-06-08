import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsService } from '@features/products/services/products-service';
import { ProductVM } from '@features/products/view-models/product-list-item.vm';

@Component({
  selector: 'app-product-table-component',
  imports: [CurrencyPipe, RouterLink],
  standalone: true,
  templateUrl: './product-table-component.html',
  styleUrl: './product-table-component.scss',
})
export class ProductTableComponent {
  products = input.required<ProductVM[]>();
  private productsService = inject(ProductsService);
  delete = output<string>();
}
