namespace Core.Results;

public record PagedResult<T>
(
    int TotalCount,
    IEnumerable<T> Data
);