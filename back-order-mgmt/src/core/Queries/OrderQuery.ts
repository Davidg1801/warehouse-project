export interface OrderQuery {
    pageNumber: number;
    pageSize: number;

    orderBy?: string | undefined; // createdAt, customerId
    descending: boolean; 

    customerId?: string | undefined;
    productIds?: string[] | undefined;
    uuid?: string | undefined;
    productName?: string | undefined;
    dateFrom?: string //ISO
    | undefined //ISO
    dateTo?: string //ISO
    | undefined //ISO
}