import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '@features/products/models/product.model';

@Component({
  selector: 'app-product-table-component',
  imports: [CurrencyPipe, RouterLink],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-table-component.html',
  styleUrl: './product-table-component.scss',
})
export class ProductTableComponent {
  readonly products = input.required<Product[]>();
  readonly productDeleted = output<string>();
}
