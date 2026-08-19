import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { outputFromObservable, takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { OrderFilters } from '@features/orders/models/order.model';
import { dateRangeValidator } from '@shared/validators/dateRange.validator';
import { debounceTime, filter, map } from 'rxjs';

export interface OrderFiltersForm {
  dateFrom: FormControl<string | null>;
  dateTo: FormControl<string | null>;
  orderId: FormControl<string | null>;
  customerId: FormControl<string | null>;
  productName: FormControl<string | null>;
}

@Component({
  selector: 'app-order-filters',
  imports: [ReactiveFormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-filters.component.html',
  styleUrl: './order-filters.component.scss',
})
export class OrderFiltersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly initialFilters = input<OrderFilters>();

  readonly filterForm = this.fb.group<OrderFiltersForm>(
    {
      dateFrom: this.fb.control(null),
      dateTo: this.fb.control(null),
      orderId: this.fb.control(null),
      customerId: this.fb.control(null),
      productName: this.fb.control(null),
    },
    { validators: [dateRangeValidator] },
  );

  readonly filtersChange = outputFromObservable<OrderFilters>(
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      filter(() => this.filterForm.valid),
      map(() => {
        const rawValues = this.filterForm.getRawValue();

        return {
          dateFrom: rawValues.dateFrom ?? null,
          dateTo: rawValues.dateTo ?? null,
          orderId: rawValues.orderId ?? null,
          customerId: rawValues.customerId ?? null,
          productName: rawValues.productName ?? null,
        };
      }),
    ),
  );

  constructor() {
    toObservable(this.initialFilters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((filters) => {
        if (filters) {
          this.filterForm.patchValue(filters, { emitEvent: false });
        }
      });
  }
}
