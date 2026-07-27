import { TestBed } from '@angular/core/testing';

import { ProductsService } from './products.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiResponse } from '@core/models/api-response.model';
import { ProductDto } from '../dtos/product.dto';
import { environment } from '@environments/environment.dev';
import { PaginatedResponse } from '@core/models/paginated-response.model';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/bff/products`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductsService, provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); //There are no pending HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send GET request with formatted query parameters and return paginated products', () => {
    const mockProduct: ProductDto = {
      uuid: '12333',
      name: 'AMD Ryzen 7 7800X3D',
      categoryId: 1,
      price: 1999,
      quantity: 51,
    };

    const mockPaginatedResponse: PaginatedResponse<ProductDto> = {
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      success: true,
      message: null,
      errors: null,
      data: [mockProduct],
    };

    service
      .getAllProducts({
        pageNumber: 1,
        pageSize: 10,
        name: 'AMD',
        categoryIds: [1],
      })
      .subscribe((response) => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(response.data.length).toBe(1);
      });

    const req = httpMock.expectOne((request) => {
      return (
        request.url === apiUrl &&
        request.params.get('PageNumber') === '1' &&
        request.params.get('Name') === 'AMD' &&
        request.params.getAll('CategoryIds')?.join(',') === '1'
      );
    });

    expect(req.request.method).toBe('GET');
    req.flush(mockPaginatedResponse);
  });

  it('should return ProductDto extracted from response data', () => {
    const mockProduct: ProductDto = {
      uuid: '123',
      name: 'Corsair RM850x',
      categoryId: 7,
      price: 699,
      quantity: 8,
    };
    const apiResponse: ApiResponse<ProductDto> = {
      success: true,
      message: null,
      errors: null,
      data: mockProduct,
    };

    service.getProduct('123').subscribe((product) => {
      expect(product).toEqual(mockProduct);
    });

    const req = httpMock.expectOne(`${apiUrl}/123`);
    expect(req.request.method).toBe('GET');
    req.flush(apiResponse);
  });
});
