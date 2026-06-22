using System.ComponentModel.DataAnnotations;
using back_warehouse_bff.Contracts.Requests;

namespace back_warehouse_bff.Tests.Contracts.Requests;

public class ProductQueryDtoTests
{
    private IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    [Fact]
    public void Validate_WhenQueryIsValid_ReturnsNoErrors()
    {
        var dto = new ProductQueryDto
        {
            PageNumber = 1,
            PageSize = 10,
            Name = "Lapt",
            OrderBy = ProductSortColumn.Price
        };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Empty(results);
    }
    [Theory]
    [InlineData(0)]
    [InlineData(-2)]
    public void Valide_WhenPageNumberIsLessThanOne_ReturnsError(int invalidPageNumber)
    {
        //Arrange
        var dto = new ProductQueryDto { PageNumber = invalidPageNumber, PageSize = 10, Name = "Lapt", OrderBy = ProductSortColumn.Price };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Single(results);
        Assert.Equal("Page number must be greater than 0.", results.First().ErrorMessage);
    }
    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void Validate_WhenPageSizeIsOutOfBounds_ReturnsError(int invalidPageSize)
    {
        //Arrange
        var dto = new ProductQueryDto { PageNumber = 1, PageSize = invalidPageSize, Name = "Lapt", OrderBy = ProductSortColumn.Price };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Single(results);
        Assert.Equal("Page size must be between 1 and 100.", results.First().ErrorMessage);
    }

    [Fact]
    public void Validate_WhenOrderByIsInvalidEnum_ReturnsError()
    {
        //Arrange
        var dto = new ProductQueryDto { PageNumber = 1, PageSize = 10, Name = "Lapt", OrderBy = (ProductSortColumn)99 };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Single(results);
        Assert.Equal("You can only order by Name, Price, or Quantity.", results.First().ErrorMessage);
    }

    [Fact]
    public void Validate_WhenNameIsTooLong_ReturnsError()
    {
        //Arrange
        var dto = new ProductQueryDto { PageNumber = 1, PageSize = 10, Name = new string('A', 101), OrderBy = ProductSortColumn.Price };
        //Act
        var results = ValidateModel(dto);
        //Assert
        Assert.Single(results);
        Assert.Equal("Search term is too long.", results.First().ErrorMessage);
    }
}