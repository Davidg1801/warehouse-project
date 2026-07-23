using back_warehouse_bff.Contracts.Requests;

namespace back_warehouse_bff.Contracts.Responses;

public class OrderResponseDto
{
    public Guid Uuid { get; set; }
    public string CategoryId { get; set; } = String.Empty;
    public OrderItemDto Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}