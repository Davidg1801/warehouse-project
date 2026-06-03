using back_warehouse_bff.Contracts.Requests;

namespace back_warehouse_bff.Contracts.Responses;

public class ProductResponseDto
{
    public Guid Uuid { get; set; }
    public string Name { get; set; } = String.Empty;
    public ProductCategory CategoryId { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}