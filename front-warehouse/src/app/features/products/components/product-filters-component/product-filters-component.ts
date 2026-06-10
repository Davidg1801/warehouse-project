import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Category } from '@features/products/models/category.model';
import { ProductFilters } from '@features/products/models/product-filters.model';

@Component({
  selector: 'app-product-filters-component',
  imports: [ReactiveFormsModule],
  standalone: true,
  templateUrl: './product-filters-component.html',
  styleUrl: './product-filters-component.scss',
})
export class ProductFiltersComponent implements OnInit {
  currentFilters = input<ProductFilters>();
  categories = input.required<Category[]>();
  private fb = inject(FormBuilder);
  filtersChanged = output<ProductFilters>();
  isDropdownOpen = signal(false);

  filterForm = this.fb.group({
    name: this.fb.control(''),
    sort: this.fb.control<
      'Name_ASC' | 'Name_DESC' | 'Price_ASC' | 'Price_DESC' | 'Quantity_ASC' | 'Quantity_DESC' | ''
    >(''),
    categoryIds: this.fb.control<number[]>([]),
  });

  constructor() {
    effect(() => {
      const filters = this.currentFilters();
      if (filters) {
        this.filterForm.patchValue(
          {
            name: filters.name ?? '',
            sort: filters.sort ?? '',
            categoryIds: filters.categoryIds ?? [],
          },
          { emitEvent: false },
        ); // emitEvent: false zapobiega pętli!
      }
    });
  }

  ngOnInit(): void {
    this.emit();
  }

  private emit() {
    this.filterForm.valueChanges.subscribe((value) => {
      this.filtersChanged.emit({
        name: value.name ?? undefined,
        sort: value.sort ?? undefined,
        categoryIds: value.categoryIds ?? [],
      });
    });
  }

  toggleDropdown() {
    this.isDropdownOpen.update((value) => !value);
  }

  isSelected(id: number): boolean {
    return (this.filterForm.value.categoryIds ?? []).includes(id);
  }

  toggleCategory(id: number) {
    const current = this.filterForm.value.categoryIds ?? [];
    const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.filterForm.patchValue({
      categoryIds: updated,
    });
  }

  removeCategory(id: number) {
    const current = this.filterForm.value.categoryIds ?? [];

    this.filterForm.patchValue({
      categoryIds: current.filter((x) => x !== id),
    });
  }

  getCategoryName(id: number) {
    return this.categories().find((c) => c.id === id)?.name;
  }
}
