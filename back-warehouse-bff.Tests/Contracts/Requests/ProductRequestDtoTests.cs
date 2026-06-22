using System.ComponentModel.DataAnnotations;
using back_warehouse_bff.Contracts.Requests;

namespace back_warehouse_bff.Tests.Contracts.Requests;

public class ProductRequestDtoTests
{
    private IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    [Fact]
    public void Validate_WhenRequestIsValid_ReturnsNoErrors()
    {
        //Arrange
        var dto = new ProductRequestDto
        {
            Name = "Test",
            CategoryId = ProductCategory.Processors,
            Quantity = 1,
            Price = 99.99m
        };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Empty(results);
    }
    [Fact]
    public void Validate_NameIsEmpty_ReturnsError()
    {
        //Arrange
        var dto = new ProductRequestDto
        {
            Name = "",
            CategoryId = ProductCategory.Processors,
            Quantity = 1,
            Price = 99.99m
        };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Single(results);
        Assert.Equal("Name field cannot be empty!", results.First().ErrorMessage);
    }
    [Fact]
    public void Validate_NameIsSizeIsOutOfBounds_ReturnsError()
    {
        //Arrange
        var dto = new ProductRequestDto
        {
            Name = new String('A', 101),
            CategoryId = ProductCategory.Processors,
            Quantity = 1,
            Price = 99.99m
        };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Single(results);
        Assert.Equal("Name cannot exceed 100 characters.", results.First().ErrorMessage);
    }

    [Fact]
    public void Validate_WhenCategoryIdIsInvalidEnum_ReturnsError()
    {
        //Arrange
        var dto = new ProductRequestDto
        {
            Name = "Test",
            CategoryId = (ProductCategory)999,
            Quantity = 1,
            Price = 99.99m
        };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Single(results);
        Assert.Equal("CategoryId with the ID does not exist in the system.", results.First().ErrorMessage);
    }

    [Theory]
    [InlineData(0.00)]
    [InlineData(10000000.00)]
    public void Validate_WhenPriceIsOutOfBounds_ReturnsError(double invalidPrice)
    {
        //Arrange
        var dto = new ProductRequestDto
        {
            Name = "Test",
            CategoryId = ProductCategory.Processors,
            Quantity = 1,
            Price = (decimal)invalidPrice
        };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Single(results);
        Assert.Equal("Price must be between 0.01 and 9999999.99.)", results.First().ErrorMessage);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(10000000)]
    public void Validate_WhenQuantityIsOutOfBounds_ReturnsError(int invalidQuantity)
    {
        //Arrange
        var dto = new ProductRequestDto
        {
            Name = "Test",
            CategoryId = ProductCategory.Processors,
            Quantity = invalidQuantity,
            Price = 99.99m
        };

        //Act
        var results = ValidateModel(dto);

        //Assert
        Assert.Single(results);
        Assert.Equal("Quantity must be between 0 and 9999999.)", results.First().ErrorMessage);
    }
}