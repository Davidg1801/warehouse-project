import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { PRODUCT_CATEGORIES } from '@features/products/constants/categories.constant';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private categories = PRODUCT_CATEGORIES;

  getAllCategories() {
    return of(this.categories);
  }
}
