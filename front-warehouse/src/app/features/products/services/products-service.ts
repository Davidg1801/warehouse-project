import { inject, Injectable } from '@angular/core';
import { PRODUCTS_MOCK } from '../mocks/products.mock';
import { map, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.dev';
import { ProductResponseDto } from '../dto/products-response.dto';
import { mapProduct } from '../mappers/product.mapper';
import { Product } from '../models/product.model';
import { CreateProductDto } from '../dto/create-product.dto';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllProducts() {
    return of(PRODUCTS_MOCK);
  }

  getProducts(): Observable<Product[]> {
    return this.http
      .get<ProductResponseDto>(`${this.apiUrl}/bff/products`)
      .pipe(map((res) => res.data.map(mapProduct)));
  }

  addProduct(product: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/bff/products`, product);
  }

  deleteProduct(uuid: string): Observable<void> {
    console.log(this.apiUrl + '/bff/products/' + uuid);
    console.log('OK OK OK DELETED');
    return this.http.delete<void>(`${this.apiUrl}/bff/products/${uuid}`);
  }
}
