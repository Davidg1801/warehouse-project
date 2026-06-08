namespace Worker.Contracts;

public class ProductQueryRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public bool Descending { get; set; } = false;
    public string? OrderBy { get; set; } = "Name";
    public string? Name { get; set; }
    public int[]? CategoryIds { get; set; }
}