using System.Globalization;

namespace Core.Entities;

public enum ProductCategory
{

    Processors = 1,
    GraphicsCards = 2,
    Motherboards = 3,
    RAM_Memory = 4,
    SSD_Drivers = 5,
    HDD_Drivers = 6,
    PowerSupplies = 7,
    ComputerCases = 8,
    CPU_Cooling = 9,
    Monitors = 10,
    Keyboards = 11,
    Mice = 12,
    Headsets = 13,
    Speakers = 14,
    Networking = 15,
    Others = 99
}
public class Product
{
    public Guid Uuid { get; init; }
    public string Name { get; set; }
    public ProductCategory CategoryId { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }

    public Product(Guid uuid, string name, ProductCategory categoryId, decimal price, int quantity)
    {
        this.Uuid = uuid;
        this.Name = name;
        this.CategoryId = categoryId;
        this.Price = price;
        this.Quantity = quantity;
    }

    public static Product CreateProduct(string name, ProductCategory categoryId, decimal price, int quantity)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty!");
        if (!Enum.IsDefined(typeof(ProductCategory), categoryId))
            throw new ArgumentException("Invalid product category!");
        if (price < 0)
            throw new ArgumentException("Price cannot be negative!");
        if (quantity < 0)
            throw new ArgumentException("Quantity cannot be negative!");
        return new Product(Guid.NewGuid(), name, categoryId, price, quantity);
    }
}