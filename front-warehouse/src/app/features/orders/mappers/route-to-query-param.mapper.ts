import { Params } from '@angular/router';
import { OrderQueryParams } from '../models/order-query-params.model';

export function mapRouteToOrderQueryParams(params: Params): OrderQueryParams {
  return {
    pageNumber: params['pageNumber'] ? Number(params['pageNumber']) : 1,
    pageSize: params['pageSize'] ? Number(params['pageSize']) : 10,
    orderBy: params['orderBy'],
    descending: params['orderBy'] ? params['descending'] === 'true' : undefined,
    customerId: params['customerId'],
    productsId: params['productsId'] ? [params['productsId']].flat().map(String) : undefined,
    orderId: params['Uuid'],
    dateFrom: params['dateFrom'],
    dateTo: params['dateTo'],
  };
}
