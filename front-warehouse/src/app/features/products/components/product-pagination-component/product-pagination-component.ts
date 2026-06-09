import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-pagination-component',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './product-pagination-component.html',
  styleUrl: './product-pagination-component.scss',
})
export class ProductPaginationComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageSize = input.required<number>();

  pageChanged = output<number>();
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
    const selectElement = event.target as HTMLSelectElement;
    const newSize = Number(selectElement.value);
    this.pageSizeChanged.emit(newSize);
  }
}
