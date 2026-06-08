namespace Core.Queries;

public record ProductQuery(
    int PageNumber,
    int PageSize,
    string? Name,
    int[]? CategoryIds,
    bool Descending,
    string? OrderBy
);