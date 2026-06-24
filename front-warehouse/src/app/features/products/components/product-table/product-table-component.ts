import { CurrencyPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  delete = output<string>();
}
