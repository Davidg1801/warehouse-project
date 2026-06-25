import { Params } from '@angular/router';
import { ProductQueryParams } from '../models/product-query-params.model';

export function mapRouteToProductQueryParams(params: Params): ProductQueryParams {
  const hasOrderBy = !!params['orderBy'];

  const queryParams: ProductQueryParams = {
    pageNumber: params['pageNumber'] ? Number(params['pageNumber']) : 1,
    pageSize: params['pageSize'] ? Number(params['pageSize']) : 10,
    name: params['name'] || undefined,
    orderBy: params['orderBy'] || undefined,
    descending: hasOrderBy ? params['descending'] === 'true' : undefined,
  };

  const categoryIds = params['categoryIds']
    ? Array.isArray(params['categoryIds'])
      ? params['categoryIds']
      : [params['categoryIds']]
    : undefined;

  if (categoryIds) {
    queryParams.categoryIds = categoryIds.map(Number);
  }

  return queryParams;
}
