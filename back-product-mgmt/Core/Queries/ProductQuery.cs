namespace Core.Queries;

public record ProductQuery(
    int PageNumber,
    int PageSize,
    string? Name,
    int? CategoryId,
    bool Descending,
    string? OrderBy
);