import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { OrderFilters } from '@features/orders/models/order.model';
import { debounceTime, map } from 'rxjs';

@Component({
  selector: 'app-order-filters',
  imports: [ReactiveFormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-filters.component.html',
  styleUrl: './order-filters.component.scss',
})
export class OrderFiltersComponent {
  initialFilters = input<OrderFilters>();

  readonly filterForm = new FormGroup({
    dateFrom: new FormControl<string | null>(null),
    dateTo: new FormControl<string | null>(null),
    customerId: new FormControl<string | null>(null),
    productsId: new FormControl<string | null>(null),
  });

  readonly filtersChange = outputFromObservable<OrderFilters>(
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      map(() => this.filterForm.getRawValue()),
    ),
  );

  constructor() {
    effect(() => {
      const filters = this.initialFilters();

      const resetValues: OrderFilters = {
        dateFrom: null,
        dateTo: null,
        customerId: null,
        productsId: null,
      };

      this.filterForm.patchValue({ ...resetValues, ...filters }, { emitEvent: false });
    });
  }
}
