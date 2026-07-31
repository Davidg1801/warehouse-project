import { Params } from '@angular/router';
import { ProductQueryParams } from '../models/product-query-params.model';

export function mapRouteToProductQueryParams(params: Params): ProductQueryParams {
  return {
    pageNumber: params['pageNumber'] ? Number(params['pageNumber']) : 1,
    pageSize: params['pageSize'] ? Number(params['pageSize']) : 10,
    name: params['name'] || undefined,
    orderBy: params['orderBy'] || undefined,
    descending: params['orderBy'] ? params['descending'] === 'true' : undefined,
    categoryIds: params['categoryIds'] ? [params['categoryIds']].flat().map(Number) : undefined,
  };
}
