namespace back_warehouse_bff.Contracts.Common;

public class PagedResponse<T> : ApiResponse<T>
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 0;
    public static PagedResponse<T> OkPaged(T data, int totalCount, int pageNumber, int pageSize, string? message = null)
    {
        return new PagedResponse<T>
        {
            Data = data,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            Success = true,
            Message = message
        };
    }

    public static PagedResponse<T> FailPaged(string message)
    {
        return new PagedResponse<T> { Success = false, Message = message };
    }

    public static PagedResponse<T> FailPaged(List<string> errors)
    {
        return new PagedResponse<T> { Success = false, Errors = errors };
    }
}