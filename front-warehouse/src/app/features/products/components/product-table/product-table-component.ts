import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '@features/products/models/product.model';

@Component({
  selector: 'app-product-table-component',
  imports: [CurrencyPipe, RouterLink],
  standalone: true,
  templateUrl: './product-table-component.html',
  styleUrl: './product-table-component.scss',
})
export class ProductTableComponent {
  products = input.required<Product[]>();
  delete = output<string>();
}
