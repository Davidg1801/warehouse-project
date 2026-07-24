namespace back_warehouse_bff.Contracts.Requests;

public class OrderRequestDto
{
    public string CustomerId { get; set; } = String.Empty;
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}