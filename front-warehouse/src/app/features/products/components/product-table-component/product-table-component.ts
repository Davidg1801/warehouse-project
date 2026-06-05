import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { ProductListItem } from '@features/products/view-models/product-list-item.vm';

@Component({
  selector: 'app-product-table-component',
  imports: [CurrencyPipe],
  standalone: true,
  templateUrl: './product-table-component.html',
  styleUrl: './product-table-component.scss',
})
export class ProductTableComponent {
  products = input.required<ProductListItem[]>();
}
