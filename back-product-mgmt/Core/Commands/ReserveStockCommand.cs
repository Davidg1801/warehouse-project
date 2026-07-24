namespace Core.Commands;

public class ReserveStockCommand
{
    public List<ReserveStockItem> Items { get; set; } = new();
}

public class ReserveStockItem
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}