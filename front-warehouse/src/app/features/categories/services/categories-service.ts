import { Injectable } from '@angular/core';
import { CATEGORIES_MOCK } from '../mocks/categories.mock';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private categories = CATEGORIES_MOCK;

  getAllCategories() {
    return of(this.categories);
  }
}
