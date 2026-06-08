import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Category } from '@features/products/models/category.model';

@Component({
  selector: 'app-product-filters-component',
  imports: [],
  standalone: true,
  templateUrl: './product-filters-component.html',
  styleUrl: './product-filters-component.scss',
})
export class ProductFiltersComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  categories = input.required<Category[]>();
  isDropdownOpen = signal(false);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly search = computed(() => this.queryParamMap().get('search') ?? '');

  readonly selectedCategoryIds = computed<number[]>(() => {
    return this.queryParamMap().getAll('categoryIds').map(Number).filter(Number.isFinite);
  });

  readonly selectedCategories = computed(() =>
    this.categories().filter((category) => this.selectedCategoryIds().includes(category.id)),
  );

  toggleDropdown(): void {
    this.isDropdownOpen.update((value) => !value);
  }

  onSearch(value: string): void {
    this.setQuery({
      search: value.trim() || null,
    });
  }

  toggleCategory(categoryId: number): void {
    const current = this.selectedCategoryIds();

    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];

    this.updateCategoriesQueryParams(updated);
  }

  removeCategory(categoryId: number): void {
    const updated = this.selectedCategoryIds().filter((id) => id !== categoryId);

    this.updateCategoriesQueryParams(updated);
  }

  isSelected(categoryId: number): boolean {
    return this.selectedCategoryIds().includes(categoryId);
  }

  private updateCategoriesQueryParams(categoryIds: number[]): void {
    this.setQuery({
      categoryIds: categoryIds.length ? categoryIds : null,
    });
  }

  private setQuery(params: Params) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }
}
