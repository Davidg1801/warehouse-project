using System.ComponentModel.DataAnnotations;

namespace back_warehouse_bff.Contracts.Requests;

public class OrderRequestDto
{
    [Required(ErrorMessage = "CustomerId is required.")]
    [MinLength(1, ErrorMessage = "CustomerId cannot be empty.")]
    [MaxLength(100, ErrorMessage = "CustomerId is too long.")]
    public string CustomerId { get; set; } = String.Empty;
    [Required(ErrorMessage = "Order must contain items.")]
    [MinLength(1, ErrorMessage = "You must add at least one item to the order.")]
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    [Required(ErrorMessage = "ProductId is required.")]
    public Guid ProductId { get; set; }
    [Range(1, int.MaxValue, ErrorMessage = "Quantity can not be lower than 1.")]
    public int Quantity { get; set; }
}