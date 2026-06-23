using Core.Entities;

namespace Core.Tests.Entities;

public class ProductTests
{
    [Fact]
    public void CreateProduct_WhenParameterAreValid_ReturnProduct()
    {
        //Arrange
        var name = "Test";
        var categoryId = ProductCategory.ComputerCases;
        var price = 20.99m;
        var quantity = 2;
        //Act
        var product = Product.CreateProduct(name, categoryId, price, quantity);
        //Assert
        Assert.NotNull(product);
        Assert.NotEqual(Guid.Empty, product.Uuid);
        Assert.Equal(name, product.Name);
        Assert.Equal(categoryId, product.CategoryId);
        Assert.Equal(price, product.Price);
        Assert.Equal(quantity, product.Quantity);
    }
    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void CreateProduct_WhenNameIsNullorWhiteSpace_ReturnArgumentException(string? invalidName)
    {
        //Arrange
        var categoryId = ProductCategory.ComputerCases;
        var price = 20.99m;
        var quantity = 2;
        //Act
        var exception = Assert.Throws<ArgumentException>(() =>
        {
            Product.CreateProduct(invalidName!, categoryId, price, quantity);
        });
        //Assert
        Assert.Equal("Name cannot be empty!", exception.Message);
    }
    [Theory]
    [InlineData(999)]
    [InlineData(-9)]
    [InlineData(0)]
    public void CreateProduct_WhenCategoryProductIdisInvalid_ReturnArgumentException(int categoryId)
    {
        //Arrange
        var name = "Test";
        var price = 20.99m;
        var quantity = 2;
        //Act
        var exception = Assert.Throws<ArgumentException>(() =>
        {
            Product.CreateProduct(name, (ProductCategory)categoryId, price, quantity);
        });
        //Assert
        Assert.Equal("Invalid product category!", exception.Message);
    }

    [Fact]
    public void CreateProduct_WhenPriceIsNegative_ReturnArgumentException()
    {
        //Arrange
        var name = "Test";
        var price = -20.99m;
        var quantity = 2;
        var categoryId = ProductCategory.ComputerCases;
        //Act
        var exception = Assert.Throws<ArgumentException>(() =>
        {
            Product.CreateProduct(name, categoryId, price, quantity);
        });
        //Assert
        Assert.Equal("Price cannot be negative!", exception.Message);
    }
    [Fact]
    public void CreateProduct_WhenQuantityIsNegative_ReturnArgumentException()
    {
        //Arrange
        var name = "Test";
        var price = 20.99m;
        var quantity = -2;
        var categoryId = ProductCategory.ComputerCases;
        //Act
        var exception = Assert.Throws<ArgumentException>(() =>
        {
            Product.CreateProduct(name, categoryId, price, quantity);
        });
        //Assert
        Assert.Equal("Quantity cannot be negative!", exception.Message);
    }
}