using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Text.Json.Serialization;

namespace back_warehouse_bff.Contracts.Requests;

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

    [RegularExpression("(?i)^(CreatedAt|CustomerId)$", ErrorMessage = "You can only order by CreatedAt and CustomerId.")]
    public string? OrderBy { get; set; } = nameof(OrderSortColumn.CreatedAt);

    [MaxLength(100, ErrorMessage = "Search term is too long.")]
    public string? CustomerId { get; set; }
    public string[]? ProductIds { get; set; }
    public string? Uuid { get; set; }
    [MaxLength(100, ErrorMessage = "Search term is too long.")]
    public string? ProductName { get; set; }
    public DateTime? DateFrom { get; set; } //ISO
    public DateTime? DateTo { get; set; } ////ISO

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DateFrom.HasValue && DateTo.HasValue && DateFrom > DateTo)
        {
            yield return new ValidationResult(
                "DateFrom cannot be later than DateTo.",
                new[] { nameof(DateFrom), nameof(DateTo) }
            );
        }
    }
}