import { Component, computed, input, signal } from '@angular/core';
import { Category } from '@features/categories/models/product.model';

@Component({
  selector: 'app-product-filters-component',
  imports: [],
  standalone: true,
  templateUrl: './product-filters-component.html',
  styleUrl: './product-filters-component.scss',
})
export class ProductFiltersComponent {
  categories = input.required<Category[]>();

  isDropdownOpen = signal(false);

  selectedCategoryIds = signal<number[]>([]);

  selectedCategories = computed(() =>
    this.categories().filter((category) => this.selectedCategoryIds().includes(category.id)),
  );

  toggleDropdown(): void {
    this.isDropdownOpen.update((value) => !value);
  }

  toggleCategory(categoryId: number): void {
    this.selectedCategoryIds.update((ids) =>
      ids.includes(categoryId) ? ids.filter((id) => id !== categoryId) : [...ids, categoryId],
    );
  }

  removeCategory(categoryId: number): void {
    this.selectedCategoryIds.update((ids) => ids.filter((id) => id !== categoryId));
  }

  isSelected(categoryId: number): boolean {
    return this.selectedCategoryIds().includes(categoryId);
  }
}
