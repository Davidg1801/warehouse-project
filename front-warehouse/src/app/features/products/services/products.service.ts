import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/bff/products`;

  // GET ALL PRODUCTS //
  getAllProducts(queryParams: ProductQueryParams): Observable<PaginatedResponse<ProductDto>> {
    const params = this.generateQueryParams(queryParams);
    return this.http.get<PaginatedResponse<ProductDto>>(this.apiUrl, { params });
  }

  // GET PRODUCT BY ID //
  getProduct(uuid: string): Observable<ProductDto> {
    return this.http
      .get<ApiResponse<ProductDto>>(`${this.apiUrl}/${uuid}`)
      .pipe(map((response) => response.data));
  }

  // ADD PRODUCT //
  addProduct(product: CreateProductDto): Observable<ProductDto> {
    return this.http
      .post<ApiResponse<ProductDto>>(this.apiUrl, product)
      .pipe(map((response) => response.data));
  }

  // UPDATE PRODUCT //
  updateProduct(product: EditProductDto): Observable<ProductDto> {
    return this.http
      .put<ApiResponse<ProductDto>>(`${this.apiUrl}/${product.uuid}`, product)
      .pipe(map((response) => response.data));
  }

  // DELETE PRODUCT //
  deleteProduct(uuid: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<boolean>>(`${this.apiUrl}/${uuid}`)
      .pipe(map((response) => response.data));
  }

  // GET TOP PRODUCTS //
  getTopProducts(count: number): Observable<ProductDto[]> {
    let params = new HttpParams();
    if (count > 0) params = params.append('count', count);
    return this.http
      .get<ApiResponse<ProductDto[]>>(`${this.apiUrl}/top`, { params })
      .pipe(map((response) => response.data));
  }

  // FUNCTION TO GENERATE QUERY PARAMS
  private generateQueryParams(queryParams: ProductQueryParams): HttpParams {
    let params = new HttpParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value == null) return;
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);

      if (Array.isArray(value)) {
        value.forEach((item) => (params = params.append(formattedKey, item.toString())));
      } else {
        params = params.set(formattedKey, value.toString());
      }
    });
    return params;
  }
}
