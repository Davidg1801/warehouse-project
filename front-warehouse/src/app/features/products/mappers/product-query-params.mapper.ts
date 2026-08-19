import { Params } from '@angular/router';
import { ProductQueryParams } from '../models/product-query-params.model';

export function mapRouteToProductQueryParams(params: Params): ProductQueryParams {
  const pageNumber = Number(params['pageNumber']);
  const pageSize = Number(params['pageSize']);

  return {
    pageNumber: !isNaN(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    pageSize: !isNaN(pageSize) && pageSize > 0 ? pageSize : 10,
    orderBy: params['orderBy'] ?? 'Name',
    descending: params['descending'] === 'true' || params['descending'] === true,
    name: params['name'] || undefined,
    categoryIds: params['categoryIds']
      ? [params['categoryIds']]
          .flat()
          .map(Number)
          .filter((id) => !isNaN(id))
      : undefined,
  };
}
