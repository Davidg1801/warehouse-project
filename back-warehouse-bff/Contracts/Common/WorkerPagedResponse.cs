namespace back_warehouse_bff.Contracts.Common;

public record WorkerPagedResponse<T>(int TotalCount, IEnumerable<T> Data);