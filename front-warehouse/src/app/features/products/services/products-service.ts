import { Injectable } from '@angular/core';
import { PRODUCTS_MOCK } from '../mocks/products.mock';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private products = PRODUCTS_MOCK;

  getAllProducts() {
    return of(this.products);
  }
}
