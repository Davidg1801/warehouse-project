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


}
