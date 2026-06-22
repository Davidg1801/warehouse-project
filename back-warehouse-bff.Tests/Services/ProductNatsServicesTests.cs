using Xunit;
using NSubstitute;
using NATS.Client.Core;
using back_warehouse_bff.Services;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using System.Text.Json;

namespace back_warehouse_bff.Tests.Services;

public class ProductNatsServiceTests
{
    private readonly INatsClient _natsClientMock;

    private readonly ProductNatsService _sut;

    public ProductNatsServiceTests()
    {
        _natsClientMock = Substitute.For<INatsClient>();
        _sut = new ProductNatsService(_natsClientMock);
    }

    [Fact]
    public async Task AddProductAsync_WhenValidRequest_ReturnsOkResponse()
    {
        //Arrange
        var request = new ProductRequestDto
        {
            Name = "RAM",
            Price = 100.99m,
            Quantity = 0,
            CategoryId = ProductCategory.RAM_Memory
        };

        var expectedResponseObj = new ProductResponseDto
        {
            Uuid = Guid.Parse("50bc2cc8-27b3-4f11-9a70-8b1d927d3c01"),
            Name = request.Name,
            CategoryId = request.CategoryId,
            Price = request.Price,
            Quantity = request.Quantity
        };

        var expectedJsonResponse = JsonSerializer.Serialize(expectedResponseObj);


        _natsClientMock.RequestAsync<string, string>(
            subject: "products.add",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = expectedJsonResponse }));

        // ACT
        var result = await _sut.AddProductAsync(request);

        //ASSERT
        Assert.True(result.Success);
        Assert.Equal("Product has been successfully created.", result.Message);
        Assert.NotNull(result.Data);
        Assert.Equal("RAM", result.Data.Name);
        Assert.Equal(100.99m, result.Data.Price);
        Assert.Equal(0, result.Data.Quantity);
        Assert.Equal(ProductCategory.RAM_Memory, result.Data.CategoryId);
    }

    [Fact]
    public async Task AddProductAsync_WhenTimesOut_ReturnsFailsResponse()
    {
        //Arrange
        var request = new ProductRequestDto
        {
            Name = "RAM",
            Price = 100.99m,
            Quantity = 0,
            CategoryId = ProductCategory.RAM_Memory
        };

        _natsClientMock.RequestAsync<string, string>(
            subject: "products.add",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new OperationCanceledException("The operation was expired")));

        //ACT
        var result = await _sut.AddProductAsync(request);

        //ASSERT
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Contains("Error: The operation was expired", result.Errors.First());
    }

    [Fact]
    public async Task AddProductAsync_WhenWorkerReturnError_ReturnFailResponse()
    {
        //Arrange
        var request = new ProductRequestDto
        {
            Name = "RAM",
            Price = 100.99m,
            Quantity = 0,
            CategoryId = ProductCategory.RAM_Memory
        };

        _natsClientMock.RequestAsync<string, string>(
            subject: "products.add",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = "ERROR: Database is not working" }));

        //ACT
        var result = await _sut.AddProductAsync(request);

        //Assert

        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Database is not working", result.Errors.First());
    }


    [Fact]
    public async Task DeleteProductAsync_WhenProductDeleted_ReturnsOkResponse()
    {
        //Arrange
        var testGuid = Guid.NewGuid();

        _natsClientMock.RequestAsync<Guid, bool>(
            subject: "products.delete",
            data: testGuid,
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<bool> { Data = true }));

        //Act
        var result = await _sut.DeleteProductAsync(testGuid);

        //Assert
        Assert.True(result.Success);
        Assert.Null(result.Errors);
        Assert.True(result.Data);
        Assert.Equal("Product has been successfully deleted.", result.Message);
    }

    [Fact]
    public async Task DeleteProductAsync_WhenProductNotFound_ReturnsFailResponse()
    {
        //Arrange
        var testGuid = Guid.NewGuid();

        _natsClientMock.RequestAsync<Guid, bool>(
            subject: "products.delete",
            data: testGuid,
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<bool> { Data = false }));

        //Act
        var result = await _sut.DeleteProductAsync(testGuid);

        //Assert
        Assert.False(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Product with the given ID does not exist or could not be deleted.", result.Errors.First());
    }

    [Fact]
    public async Task DeleteProductAsync_WhenTimesOut_ReturnsFailsResponse()
    {
        //Arrange
        var testGuid = Guid.NewGuid();

        _natsClientMock.RequestAsync<Guid, bool>(
            subject: "products.delete",
            data: testGuid,
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<bool>>(new OperationCanceledException()));

        //Act
        var result = await _sut.DeleteProductAsync(testGuid);

        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Message);
        Assert.NotNull(result.Errors);
        Assert.Equal("Error: Request to Worker timed out. Please try again later.", result.Errors.First());
    }

    [Fact]
    public async Task DeleteProductAsync_WhenComunicationError_ReturnsFailsResponse()
    {
        var testGuid = Guid.NewGuid();

        _natsClientMock.RequestAsync<Guid, bool>(
            subject: "products.delete",
            data: testGuid,
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<bool>>(new Exception("Nats server not response")));

        //Act
        var result = await _sut.DeleteProductAsync(testGuid);

        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Message);
        Assert.NotNull(result.Errors);
        Assert.Equal("NATS communication error: Nats server not response", result.Errors.First());
    }

    [Fact]
    public async Task UpdateProductAsync_WhenProductUpdated_ReturnsOkResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        var request = new ProductRequestDto
        {
            Name = "Ram",
            CategoryId = ProductCategory.RAM_Memory,
            Price = 999.99M,
            Quantity = 2
        };

        var response = new ProductResponseDto
        {
            Uuid = uuid,
            Name = request.Name,
            CategoryId = request.CategoryId,
            Price = request.Price,
            Quantity = request.Quantity
        };

        var jsonResponse = JsonSerializer.Serialize(response);
        _natsClientMock.RequestAsync<string, string>(
            subject: "products.update",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = jsonResponse }));
        //Act
        var result = await _sut.UpdateProductAsync(uuid, request);
        //Assert
        Assert.True(result.Success);
        Assert.Null(result.Errors);
        Assert.NotNull(result.Data);
        Assert.Equal("Product has been successfully updated.", result.Message);
        Assert.Equal(uuid, result.Data.Uuid);
        Assert.Equal(request.CategoryId, result.Data.CategoryId);
        Assert.Equal(request.Price, result.Data.Price);
        Assert.Equal(request.Quantity, result.Data.Quantity);
        Assert.Equal(request.Name, result.Data.Name);
    }

    [Fact]
    public async Task UpdateProductAsync_WhenProductNotFound_ReturnsFailResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        var request = new ProductRequestDto
        {
            Name = "Ram",
            CategoryId = ProductCategory.RAM_Memory,
            Price = 999.99M,
            Quantity = 2
        };

        var workerResponse = "ERROR: Product not found in the database.";
        _natsClientMock.RequestAsync<string, string>(
            subject: "products.update",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = workerResponse }));
        //Act
        var result = await _sut.UpdateProductAsync(uuid, request);
        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Product not found in the database.", result.Errors.First());
    }
    [Fact]
    public async Task UpdateProductAsync_WhenTimesOut_ReturnsFailResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        var request = new ProductRequestDto
        {
            Name = "Ram",
            CategoryId = ProductCategory.RAM_Memory,
            Price = 999.99M,
            Quantity = 2
        };

        _natsClientMock.RequestAsync<string, string>(
            subject: "products.update",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new OperationCanceledException()));
        //Act
        var result = await _sut.UpdateProductAsync(uuid, request);
        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Error: Request to Worker timed out. Please try again later.", result.Errors.First());
    }

    [Fact]
    public async Task UpdateProductAsync_WhenComunicationError_ReturnsFailResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();

        var request = new ProductRequestDto
        {
            Name = "Ram",
            CategoryId = ProductCategory.RAM_Memory,
            Price = 999.99M,
            Quantity = 2
        };

        _natsClientMock.RequestAsync<string, string>(
            subject: "products.update",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new Exception("Nats server not response")));
        //Act
        var result = await _sut.UpdateProductAsync(uuid, request);
        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Message);
        Assert.NotNull(result.Errors);
        Assert.Equal("NATS communication error: Nats server not response", result.Errors.First());
    }

    [Fact]
    public async Task GetProductByIdAsync_WhenProductIsExist_ReturnsOkResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();

        var response = new ProductResponseDto
        {
            Uuid = uuid,
            Name = "Ram",
            CategoryId = ProductCategory.RAM_Memory,
            Price = 999.99M,
            Quantity = 2
        };

        var jsonResponse = JsonSerializer.Serialize(response);

        _natsClientMock.RequestAsync<Guid, string>(
            subject: "products.get",
            data: Arg.Any<Guid>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = jsonResponse }));
        //Act
        var result = await _sut.GetProductByIdAsync(uuid);
        //Assert
        Assert.True(result.Success);
        Assert.Null(result.Errors);
        Assert.NotNull(result.Data);
        Assert.Equal(uuid, result.Data.Uuid);
        Assert.Equal(response.Name, result.Data.Name);
        Assert.Equal(response.Price, result.Data.Price);
        Assert.Equal(response.Quantity, result.Data.Quantity);
        Assert.Equal(response.CategoryId, result.Data.CategoryId);
    }
    [Fact]
    public async Task GetProductByIdAsync_WhenProductNotFound_ReturnsFailResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();

        var response = "ERROR: Product not found in the database.";
        _natsClientMock.RequestAsync<Guid, string>(
            subject: "products.get",
            data: Arg.Any<Guid>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = response }));
        //Act
        var result = await _sut.GetProductByIdAsync(uuid);
        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Product not found in the database.", result.Errors.First());
    }
    [Fact]
    public async Task GetProductByIdAsync_WhenTimesOut_ReturnsFailResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();

        _natsClientMock.RequestAsync<Guid, string>(
            subject: "products.get",
            data: Arg.Any<Guid>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new OperationCanceledException()));
        //Act
        var result = await _sut.GetProductByIdAsync(uuid);
        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Error: Request to Worker timed out. Please try again later.", result.Errors.First());
    }

    [Fact]
    public async Task GetProductByIdAsync_WhenComunicationError_ReturnsFailResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();

        _natsClientMock.RequestAsync<Guid, string>(
            subject: "products.get",
            data: Arg.Any<Guid>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new Exception("Nats server not response")));
        //Act
        var result = await _sut.GetProductByIdAsync(uuid);
        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("NATS communication error: Nats server not response", result.Errors.First());
    }
    [Fact]
    public async Task GetAllProductAsync_WhenValidRequest_ReturnsOkPagedResponse()
    {
        //Arrange
        var productsReponse = new
        {
            Data = new List<ProductResponseDto>
            {
                new ProductResponseDto { Uuid = Guid.NewGuid(), Name ="Ram", CategoryId= ProductCategory.RAM_Memory, Quantity = 9, Price = 999.99m},
                new ProductResponseDto { Uuid = Guid.NewGuid(), Name ="Radeon FXD", CategoryId= ProductCategory.GraphicsCards, Quantity = 1, Price = 2999.99m}
            },
            TotalCount = 2
        };

        var jsonResponse = JsonSerializer.Serialize(productsReponse);
        _natsClientMock.RequestAsync<string, string>(
            subject: "products.getall",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = jsonResponse }));
        //Act
        var result = await _sut.GetAllProductsAsync(null);
        //Assert
        Assert.True(result.Success);
        Assert.Null(result.Errors);
        Assert.NotNull(result.Data);
        Assert.Equal(productsReponse.TotalCount, result.TotalCount);
        Assert.Equal(1, result.PageNumber);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(2, result.Data.Count());
    }
    [Fact]
    public async Task GetAllProductAsync_WhenParserNotWork_ReturnsFailPagedResponse()
    {
        //Arrange
        _natsClientMock.RequestAsync<string, string>(
            subject: "products.getall",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = "null" }));

        //Act
        var result = await _sut.GetAllProductsAsync();

        //Assert
        Assert.False(result.Success);
        Assert.NotNull(result.Errors);
        Assert.Equal("Failed to parse worker response.", result.Errors.First());
    }
    [Fact]
    public async Task GetAllProductAsync_WhenTimesOut_ReturnsFailPagedResponse()
    {
        //Arrange
        _natsClientMock.RequestAsync<string, string>(
            subject: "products.getall",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new OperationCanceledException()));
        //Act
        var result = await _sut.GetAllProductsAsync();
        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Error: Request to Worker timed out. Please try again later.", result.Errors.First());
    }
    [Fact]
    public async Task GetAllProductAsync_WhenComunicationError_ReturnsFailPagedResponse()
    {
        var errorMessage = "NATS connection lost";
        _natsClientMock.RequestAsync<string, string>(
            subject: "products.getall",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new Exception(errorMessage)));
        //Act
        var result = await _sut.GetAllProductsAsync();
        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("NATS communication error: NATS connection lost", result.Errors.First());
    }
}
