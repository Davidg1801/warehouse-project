using System.ComponentModel.DataAnnotations;
using back_warehouse_bff.Contracts.Requests;

namespace back_warehouse_bff.Tests.Contracts.Requests;

public class OrderQueryDtoTests
{
    private IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    [Fact]
    public void Validate_WhenDefaultModel_ReturnsNoErrors()
    {
        //Arrange
        var model = new OrderQueryDto();
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_WhenPageNumberIsLessThanOne_ReturnsError(int invalidPageNumber)
    {
        //Arrange
        var model = new OrderQueryDto { PageNumber = invalidPageNumber };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "Page number must be greater than 0.");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void Validate_WhenPageSizeIsOutOfBounds_ReturnsError(int invalidPageSize)
    {
        //Arrange
        var model = new OrderQueryDto { PageSize = invalidPageSize };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "Page size must be between 1 and 100.");
    }

    [Theory]
    [InlineData("CreatedAt")]
    [InlineData("createdat")]
    [InlineData("CUSTOMERID")]
    [InlineData("CustomerId")]
    public void Validate_WhenOrderByIsCorrect_ReturnsNoErrors(string validOrderBy)
    {
        //Arrange
        var model = new OrderQueryDto { OrderBy = validOrderBy };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Empty(results);
    }

    [Theory]
    [InlineData("Price")]
    [InlineData("InvalidColumn")]
    [InlineData("CreatedAt_DESC")]
    public void Validate_WhenOrderByIsInvalid_ReturnsError(string invalidOrderBy)
    {
        //Arrange
        var model = new OrderQueryDto { OrderBy = invalidOrderBy };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "You can only order by CreatedAt and CustomerId.");
    }

    [Fact]
    public void Validate_WhenCustomerIdIsTooLong_ReturnsError()
    {
        //Arrange
        var model = new OrderQueryDto { CustomerId = new string('A', 101) };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "Search term is too long.");
    }

    [Fact]
    public void Validate_WhenDateFromIsLaterThanDateTo_ReturnsError()
    {
        //Arrange
        var model = new OrderQueryDto
        {
            DateFrom = new DateTime(2023, 12, 31),
            DateTo = new DateTime(2023, 1, 1)
        };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Contains(results, r => r.ErrorMessage == "DateFrom cannot be later than DateTo.");
        var error = results.First(r => r.ErrorMessage == "DateFrom cannot be later than DateTo.");
        Assert.Contains("DateFrom", error.MemberNames);
        Assert.Contains("DateTo", error.MemberNames);
    }

    [Fact]
    public void Validate_WhenDateFromIsBeforeOrEqualDateTo_ReturnsNoErrors()
    {
        //Arrange
        var model = new OrderQueryDto
        {
            DateFrom = new DateTime(2023, 1, 1),
            DateTo = new DateTime(2023, 12, 31)
        };
        //Act
        var results = ValidateModel(model);
        //Assert
        Assert.Empty(results);
    }

    [Fact]
    public void Validate_WhenOnlyOneDateIsProvided_ReturnsNoErrors()
    {
        //Arrange
        var model1 = new OrderQueryDto { DateFrom = new DateTime(2023, 1, 1), DateTo = null };
        var model2 = new OrderQueryDto { DateFrom = null, DateTo = new DateTime(2023, 12, 31) };
        //Act
        var results1 = ValidateModel(model1);
        var results2 = ValidateModel(model2);
        //Assert
        Assert.Empty(results1);
        Assert.Empty(results2);
    }
}
