using back_warehouse_bff.Contracts.Requests;

namespace back_warehouse_bff.Contracts.Responses;

public class OrderResponseDto
{
    public Guid Uuid { get; set; }
    public string CustomerId { get; set; } = String.Empty;
    public List<OrderItemDto> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}