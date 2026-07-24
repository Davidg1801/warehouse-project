namespace Worker.Contracts.Requests;

public class ReserveStockRequest
{
    public List<ReserveStockItem> Items { get; set; } = new();
}

public class ReserveStockItem
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}