import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ProductSortColumn,
  ProductSortState,
} from '@features/products/models/product-query-params.model';
import { Product } from '@features/products/models/product.model';
import { SortDirection } from '@shared/models/sort.model';

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

  readonly currentSort = input<ProductSortState>({ column: 'Name', direction: 'asc' });
  readonly sortChange = output<ProductSortState>();

  toggleSort(column: ProductSortColumn): void {
    const activeSort = this.currentSort();
    let sortDirection: SortDirection = 'asc';

    if (activeSort.column === column)
      sortDirection = activeSort.direction === 'asc' ? 'desc' : 'asc';

    this.sortChange.emit({
      column: column,
      direction: sortDirection,
    });
  }
}
