using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace back_warehouse_bff.Contracts.Requests;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderSortColumn
{
    CreatedAt,
    CustomerId
}
public class OrderQueryDto : IValidatableObject
{
    [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0.")]
    public int? PageNumber { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100.")]
    public int? PageSize { get; set; } = 10;

    public bool? Descending { get; set; } = false;

    [EnumDataType(typeof(OrderSortColumn), ErrorMessage = "You can only order by CreatedAt and CustomerId.")]
    public OrderSortColumn? OrderBy { get; set; } = OrderSortColumn.CreatedAt;

    [MaxLength(100, ErrorMessage = "Search term is too long.")]
    public string? CustomerId { get; set; }
    public string[]? ProductIds { get; set; }
    public Guid? Uuid { get; set; }
    public DateTime? DateFrom { get; set; } //ISO
    public DateTime? DateTo { get; set; } ////ISO

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DateFrom.HasValue && DateTo.HasValue)
        {
            if (DateFrom > DateTo)
            {
                yield return new ValidationResult(
                    "DateFrom cannot be later than DateTo."
                    , new[] { nameof(DateFrom), nameof(DateTo) }
                );
            }
        }
    }
}