import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pagination } from '@shared/models/pagination.model';

@Component({
  selector: 'app-pagination',
  imports: [FormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  protected readonly Math = Math;
  readonly pageSizeOptions = input<number[]>([10, 20, 50, 100]);

  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageSize = input<number>(10);
  readonly totalCount = input.required<number>();

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<Pagination>();

  readonly resultFrom = computed(() => {
    if (this.totalCount() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  readonly resultTo = computed(() => {
    const currentLimit = this.currentPage() * this.pageSize();
    return this.totalCount() > currentLimit ? currentLimit : this.totalCount();
  });

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(newSize: number): void {
    if (!newSize || isNaN(newSize) || newSize <= 0) {
      return;
    }
    this.pageSizeChange.emit({ pageNumber: 1, pageSize: newSize });
  }
}
