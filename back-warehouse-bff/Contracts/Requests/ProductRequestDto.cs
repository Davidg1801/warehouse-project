using System.ComponentModel.DataAnnotations;

namespace back_warehouse_bff.Contracts.Requests;

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
public class ProductRequestDto
{
    [Required(ErrorMessage = "Name field cannot be empty!")]
    [MaxLength(100, ErrorMessage = "Name cannot exceed {1} characters.")]
    public string Name { get; set; } = String.Empty;

    [Required(ErrorMessage = "CategoryId field is required!")]
    [EnumDataType(typeof(ProductCategory), ErrorMessage = "CategoryId with the ID does not exist in the system.")]
    public ProductCategory CategoryId { get; set; }

    [Required(ErrorMessage = "Price field is required!")]
    [Range(0.01, 9999999.99, ErrorMessage = "Price must be between {1} and {2}.)")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "Quantity field is required")]
    [Range(0, 9999999, ErrorMessage = "Price must be between {1} and {2}.)")]
    public int Quantity { get; set; }
}