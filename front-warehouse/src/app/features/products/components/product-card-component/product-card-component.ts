import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Product } from '@features/products/models/product.model';

@Component({
  selector: 'app-product-card-component',
  imports: [CurrencyPipe],
  standalone: true,
  templateUrl: './product-card-component.html',
  styleUrl: './product-card-component.scss',
})
export class ProductCardComponent {
  product = input.required<Product>();
}
