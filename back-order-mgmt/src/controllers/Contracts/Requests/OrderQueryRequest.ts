export class OrderQueryRequest {
    public readonly pageNumber: number = 1;
    public readonly pageSize: number = 10;
    public readonly orderBy: string = "createdAt"; // createdAt, customerId
    public readonly descending: boolean = false; 

    public readonly customerId?: string;
    public readonly productIds?: string[];
    public readonly uuid?: string;
    public readonly dateFrom?: string; //ISO
    public readonly dateTo?: string; //ISO

    public constructor(init?: Partial<OrderQueryRequest>) {
        if (init) {
            Object.assign(this, init);
        }
    }
}