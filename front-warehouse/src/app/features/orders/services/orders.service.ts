import { inject, Injectable } from '@angular/core';
import { PaginatedResponse } from '@core/models/paginated-response.model';
import { environment } from '@environments/environment.dev';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse } from '@core/models/api-response.model';
import { OrderQueryParams } from '../models/order-query-params.model';
import { CreateOrderDto, OrderDto } from '../dtos/order.dto';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/bff/orders`;

  // GET ALL ORDERS //
  getAllOrders(queryParams: OrderQueryParams): Observable<PaginatedResponse<OrderDto>> {
    console.log(queryParams);
    const params = this.generateQueryParams(queryParams);
    return this.http.get<PaginatedResponse<OrderDto>>(this.apiUrl, { params });
  }

  // GET ORDER BY ID //
  getOrder(uuid: string): Observable<OrderDto> {
    return this.http
      .get<ApiResponse<OrderDto>>(`${this.apiUrl}/${uuid}`)
      .pipe(map((response) => response.data));
  }

  // ADD ORDER //
  addOrder(Order: CreateOrderDto): Observable<OrderDto> {
    return this.http
      .post<ApiResponse<OrderDto>>(this.apiUrl, Order)
      .pipe(map((response) => response.data));
  }

  // FUNCTION TO GENERATE QUERY PARAMS
  private generateQueryParams(queryParams: OrderQueryParams): HttpParams {
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
