import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-product-pagination-component',
  imports: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-pagination-component.html',
  styleUrl: './product-pagination-component.scss',
})
export class ProductPaginationComponent {
  readonly pageSizes = [10, 30, 50];
  readonly currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageSize = input.required<number>();

  readonly pageChanged = output<number>();
  pageSizeChanged = output<number>();

  onPrevPage(): void {
    if (this.currentPage() > 1) {
      this.pageChanged.emit(this.currentPage() - 1);
    }
  }

  onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChanged.emit(this.currentPage() + 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!Number.isFinite(value)) return;
    this.pageSizeChanged.emit(value);
  }
}
