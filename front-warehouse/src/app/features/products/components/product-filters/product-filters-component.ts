import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import {
  outputFromObservable,
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Category } from '@features/categories/models/category.model';
import { ProductFilters } from '@features/products/models/product-filters.model';
import { debounceTime, map } from 'rxjs';

export interface ProductFiltersForm {
  name: FormControl<string | null>;
  categoryIds: FormControl<number[] | null>;
}

@Component({
  selector: 'app-product-filters-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './product-filters-component.html',
  styleUrl: './product-filters-component.scss',
})
export class ProductFiltersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialFilters = input<ProductFilters>();
  readonly categories = input.required<Category[]>();

  readonly isDropdownOpen = signal(false);

  readonly filterForm = this.fb.group<ProductFiltersForm>({
    name: this.fb.control(''),
    categoryIds: this.fb.control<number[]>([]),
  });

  readonly filtersChange = outputFromObservable<ProductFilters>(
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      map(() => {
        const rawValues = this.filterForm.getRawValue();

        return {
          name: rawValues.name ?? '',
          categoryIds: rawValues.categoryIds ?? [],
        };
      }),
    ),
  );

  private readonly formValue = toSignal(this.filterForm.valueChanges, {
    initialValue: this.filterForm.value,
  });

  readonly selectedCategoryIdsSet = computed(() => new Set(this.formValue().categoryIds ?? []));
  readonly selectedCategories = computed(() => {
    const selectedCat = this.selectedCategoryIdsSet();
    return this.categories().filter((c) => selectedCat.has(c.id));
  });

  constructor() {
    toObservable(this.initialFilters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((filters) => {
        if (filters) {
          this.filterForm.patchValue(filters, { emitEvent: false });
        }
      });
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update((v) => !v);
  }

  toggleCategory(id: number): void {
    const current = this.filterForm.controls.categoryIds.value ?? [];
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.filterForm.controls.categoryIds.setValue(updated);
  }

  removeCategory(id: number): void {
    const current = this.filterForm.controls.categoryIds.value ?? [];
    this.filterForm.controls.categoryIds.setValue(current.filter((x) => x !== id));
  }
}
