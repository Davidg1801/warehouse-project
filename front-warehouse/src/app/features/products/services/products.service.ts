import { inject, Injectable } from '@angular/core';
import { PRODUCTS_MOCK } from '../mocks/products.mock';
import { map, Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Product } from '../models/product.model';
import { CreateProductDto } from '../dtos/create-product.dto';
import { ApiResponse } from '@core/models/api-response.model';
import { ProductDto } from '../dtos/product.dto';
import { PaginatedResponse } from '@core/models/paginated-response.model';
import { ProductQueryParams } from '../models/product-query-params.model';
import { EditProductDto } from '../dtos/edit-product.dto';
import { environment } from '@environments/environment.dev';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllProductsMOCK() {
    return of(PRODUCTS_MOCK);
  }

  getAllProducts(queryParams: ProductQueryParams): Observable<PaginatedResponse<ProductDto>> {
    let params = new HttpParams();

    if (queryParams.pageNumber)
      params = params.set('PageNumber', queryParams.pageNumber.toString());

    if (queryParams.pageSize) params = params.set('PageSize', queryParams.pageSize.toString());

    if (queryParams.name) params = params.set('Name', queryParams.name);

    if (queryParams.orderBy) params = params.set('OrderBy', queryParams.orderBy);

    if (queryParams.descending !== undefined) {
      params = params.set('Descending', queryParams.descending.toString());
    }

    if (queryParams.categoryIds && queryParams.categoryIds.length > 0) {
      queryParams.categoryIds.forEach((id) => {
        params = params.append('CategoryIds', id.toString());
      });
    }

    return this.http.get<PaginatedResponse<ProductDto>>(`${this.apiUrl}/bff/products`, { params });
  }

  getProduct(uuid: string): Observable<ProductDto> {
    return this.http
      .get<ApiResponse<ProductDto>>(`${this.apiUrl}/bff/products/${uuid}`)
      .pipe(map((response) => response.data));
  }

  addProduct(product: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/bff/products`, product);
  }

  updateProduct(product: EditProductDto): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/bff/products/${product.uuid}`, product);
  }

  deleteProduct(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bff/products/${uuid}`);
  }
}
