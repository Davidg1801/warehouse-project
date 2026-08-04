using System.ComponentModel.DataAnnotations;
using back_warehouse_bff.Contracts.Requests;

namespace back_warehouse_bff.Tests.Contracts.Requests;

public class OrderRequestDtoTests
{
    private IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    [Fact]
    public void Validate_WhenOrderRequestIsValid_ReturnsNoErrors()
    {
        // Arrange
        var model = new OrderRequestDto
        {
            CustomerId = "Cust1",
            Items = new List<OrderItemDto>
            {
                new OrderItemDto { ProductId = Guid.NewGuid(), Quantity = 2 }
            }
        };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Empty(results);
    }

    [Fact]
    public void Validate_WhenCustomerIdIsEmpty_ReturnsValidationError()
    {
        //Arrange
        var model = new OrderRequestDto
        {
            CustomerId = "",
            Items = new List<OrderItemDto> { new OrderItemDto { ProductId = Guid.NewGuid(), Quantity = 1 } }
        };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "CustomerId is required.");
    }

    [Fact]
    public void Validate_WhenCustomerIdIsTooLong_ReturnsValidationError()
    {
        //Arrange
        var model = new OrderRequestDto
        {
            CustomerId = new string('A', 101),
            Items = new List<OrderItemDto> { new OrderItemDto { ProductId = Guid.NewGuid(), Quantity = 1 } }
        };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "CustomerId is too long.");
    }

    [Fact]
    public void Validate_WhenItemsListIsNull_ReturnsValidationError()
    {
        //Arrange
        var model = new OrderRequestDto
        {
            CustomerId = "Cust1",
            Items = null!
        };

        //Act
        var results = ValidateModel(model);

        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "Order must contain items.");
    }

    [Fact]
    public void Validate_WhenItemsListIsEmpty_ReturnsValidationError()
    {
        //Arrange
        var model = new OrderRequestDto
        {
            CustomerId = "Cust1",
            Items = new List<OrderItemDto>()
        };

        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "You must add at least one item to the order.");
    }

    [Fact]
    public void Validate_WhenOrderItemIsValid_ReturnsNoErrors()
    {
        //Arrange
        var model = new OrderItemDto
        {
            ProductId = Guid.NewGuid(),
            Quantity = 1
        };
        //Act
        var results = ValidateModel(model);

        //Assert
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public void Validate_WhenQuantityIsLessThanOne_ReturnsValidationError(int invalidQuantity)
    {
        //Arrange
        var model = new OrderItemDto
        {
            ProductId = Guid.NewGuid(),
            Quantity = invalidQuantity
        };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "Quantity can not be lower than 1.");
    }
}