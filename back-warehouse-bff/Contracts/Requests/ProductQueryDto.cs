using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace back_warehouse_bff.Contracts.Requests;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ProductSortColumn
{
    Name,
    Price,
    Quantity
}
public class ProductQueryDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0.")]
    public int? PageNumber { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100.")]
    public int? PageSize { get; set; } = 10;

    public bool? Descending { get; set; } = false;

    [RegularExpression("^(?i)(Name|Price|Quantity)$", ErrorMessage = "You can only order by Name, Price, or Quantity.")]
    public ProductSortColumn? OrderBy { get; set; } = ProductSortColumn.Name;

    [MaxLength(100, ErrorMessage = "Search term is too long.")]
    public string? Name { get; set; }
    public ProductCategory[]? CategoryIds { get; set; }
}