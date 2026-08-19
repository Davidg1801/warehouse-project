import { Params } from '@angular/router';
import { OrderQueryParams } from '@features/orders/models/order-query-params.model';

export function mapRouteToOrderQueryParams(params: Params): OrderQueryParams {
  const pageNumber = Number(params['pageNumber']);
  const pageSize = Number(params['pageSize']);

  return {
    //Check if pageNumber and pageSize is number value and > 0
    pageNumber: !isNaN(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    pageSize: !isNaN(pageSize) && pageSize > 0 ? pageSize : 10,

    // Default sorting by CreatedAt
    orderBy: params['orderBy'] ?? 'CreatedAt',
    descending: params['descending'] !== 'false' && params['descending'] !== false,
    customerId: params['customerId'] || undefined,
    uuid: params['uuid'] || undefined,
    productName: params['productName'] || undefined,
    dateFrom: params['dateFrom'] ? `${params['dateFrom']}T00:00:00.000Z` : undefined,
    dateTo: params['dateTo'] ? `${params['dateTo']}T23:59:59.999Z` : undefined,
  };
}
