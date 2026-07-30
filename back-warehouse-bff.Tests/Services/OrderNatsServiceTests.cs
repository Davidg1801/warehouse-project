using System.Text.Json;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services;
using back_warehouse_bff.Services.Interfaces;
using NATS.Client.Core;
using NSubstitute;
using NSubstitute.ReceivedExtensions;

namespace back_warehouse_bff.Tests.Services;

public class OrderNatsServiceTests
{
    private readonly INatsClient _natsClientMock;
    private readonly IProductNotificationService _notificationServiceMock;
    private readonly IProductTopCacheService _topCacheServiceMock;
    private readonly OrderNatsService _sut;

    public OrderNatsServiceTests()
    {
        _natsClientMock = Substitute.For<INatsClient>();
        _notificationServiceMock = Substitute.For<IProductNotificationService>();
        _topCacheServiceMock = Substitute.For<IProductTopCacheService>();
        _sut = new OrderNatsService(_natsClientMock, _notificationServiceMock, _topCacheServiceMock);
    }

    [Fact]
    public async Task AddOrderAsync_WhenRequestIsValid_ReturnOkResponse()
    {
        //Arrange
        var productId = Guid.NewGuid();
        var request = new OrderRequestDto
        {
            CustomerId = "Test",
            Items = [ new OrderItemDto {
                ProductId = productId,
                Quantity = 2
            } ]
        };

        var expectedResponseObj = new OrderResponseDto
        {
            Uuid = Guid.NewGuid(),
            CustomerId = "Test",
            Items = request.Items
        };
        var expectedJsonResponse = JsonSerializer.Serialize(expectedResponseObj);

        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.add",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = expectedJsonResponse }));

        _topCacheServiceMock.IsProductInTopAsync(productId).Returns(false);
        //Act
        var result = await _sut.AddOrderAsync(request);
        //Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Test", result.Data!.CustomerId);

        await _natsClientMock.Received(1).RequestAsync<string, string>(
            "orders.add",
            Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        );
        await _notificationServiceMock.Received(1).NotifyProductsUpdatedAsync();
        await _notificationServiceMock.DidNotReceive().NotifyTopProductsUpdatedAsync();
    }

    [Fact]
    public async Task AddOrderAsync_WhenRequestIsValidAndProductIsOnTop_ReturnOkResponseAndUpdateTopCacheAndNotify()
    {
        //Arrange
        var productId = Guid.NewGuid();
        var request = new OrderRequestDto
        {
            CustomerId = "Test",
            Items = [ new OrderItemDto {
                ProductId = productId,
                Quantity = 2
            } ]
        };
        var productDto = new ProductResponseDto { Uuid = productId, Name = "Laptop", Quantity = 9 };
        var productJsonResponse = JsonSerializer.Serialize(productDto);
        var expectedResponseObj = new OrderResponseDto
        {
            Uuid = Guid.NewGuid(),
            CustomerId = "Test",
            Items = request.Items
        };
        var expectedJsonResponse = JsonSerializer.Serialize(expectedResponseObj);

        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.add",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = expectedJsonResponse }));

        _topCacheServiceMock.IsProductInTopAsync(productId).Returns(true);
        _natsClientMock.RequestAsync<Guid, string>(
            subject: "products.get",
            data: productId,
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = productJsonResponse }));
        //Act
        var result = await _sut.AddOrderAsync(request);
        //Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal("Test", result.Data!.CustomerId);
        await _topCacheServiceMock.Received(1).UpdateProductDataAsync(Arg.Is<ProductResponseDto>(p => p.Uuid == productId && p.Quantity == 9));
        await _notificationServiceMock.Received(1).NotifyTopProductsUpdatedAsync();
        await _notificationServiceMock.Received(1).NotifyProductsUpdatedAsync();
    }
    [Fact]
    public async Task AddOrderAsync_WhenWorkerReturnsError_ReturnsFailResponse()
    {
        //Arrange
        var request = new OrderRequestDto
        {
            CustomerId = "Test",
            Items = [new OrderItemDto { ProductId = Guid.NewGuid(), Quantity = 2 }]
        };

        var errorMsg = "ERROR: Insufficient stock | Product not found";

        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.add",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = errorMsg }));

        //Act
        var result = await _sut.AddOrderAsync(request);

        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal(2, result.Errors.Count);
        Assert.Contains("Insufficient stock", result.Errors);
        Assert.Contains("Product not found", result.Errors);

        await _notificationServiceMock.DidNotReceive().NotifyProductsUpdatedAsync();
    }

    [Fact]
    public async Task AddOrderAsync_WhenNatsThrowsException_ReturnsFailResponse()
    {
        //Arrange
        var request = new OrderRequestDto
        {
            CustomerId = "Test",
            Items = [new OrderItemDto { ProductId = Guid.NewGuid(), Quantity = 2 }]
        };

        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.add",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new Exception("NATS Server Timeout")));

        //Act
        var result = await _sut.AddOrderAsync(request);

        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Error: NATS Server Timeout", result.Errors.First());
    }

    [Fact]
    public async Task AddOrderAsync_WhenCacheUpdateFails_StillReturnsOkResponse()
    {
        //Arrange
        var productId = Guid.NewGuid();
        var request = new OrderRequestDto
        {
            CustomerId = "Test",
            Items = [new OrderItemDto { ProductId = productId, Quantity = 2 }]
        };

        var expectedOrderDto = new OrderResponseDto { Uuid = Guid.NewGuid(), CustomerId = "Test", Items = request.Items };
        var orderJsonResponse = JsonSerializer.Serialize(expectedOrderDto);

        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.add",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = orderJsonResponse }));

        _topCacheServiceMock.IsProductInTopAsync(productId).Returns(true);

        _natsClientMock.RequestAsync<Guid, string>(
            subject: "products.get",
            data: productId,
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new Exception("Cache timeout")));

        //Act
        var result = await _sut.AddOrderAsync(request);

        //Assert
        Assert.True(result.Success);
        await _topCacheServiceMock.DidNotReceiveWithAnyArgs().UpdateProductDataAsync(default!);
        await _notificationServiceMock.Received(1).NotifyProductsUpdatedAsync();
        await _notificationServiceMock.DidNotReceive().NotifyTopProductsUpdatedAsync();
    }
    [Fact]
    public async Task GetAllOrdersAsync_WhenValidRequest_ReturnsOkPagedResponse()
    {
        //Arrange
        var workerResponse = new
        {
            Data = new List<OrderResponseDto>
            {
                new OrderResponseDto { Uuid = Guid.NewGuid(), CustomerId = "Cust1" },
                new OrderResponseDto { Uuid = Guid.NewGuid(), CustomerId = "Cust2" }
            },
            TotalCount = 2
        };

        var jsonResponse = JsonSerializer.Serialize(workerResponse);

        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.getall",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = jsonResponse }));

        //Act
        var result = await _sut.GetAllOrdersAsync(null);

        //Assert
        Assert.True(result.Success);
        Assert.Null(result.Errors);
        Assert.NotNull(result.Data);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(1, result.PageNumber);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(2, result.Data.Count());
    }

    [Fact]
    public async Task GetAllOrdersAsync_WhenTimesOut_ReturnsFailPagedResponse()
    {
        //Arrange
        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.getall",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new OperationCanceledException()));

        //Act
        var result = await _sut.GetAllOrdersAsync();

        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Error: Request to NATS timed out. Please try again later.", result.Errors.First());
    }

    [Fact]
    public async Task GetAllOrdersAsync_WhenCommunicationError_ReturnsFailPagedResponse()
    {
        //Arrange
        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.getall",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new Exception("NATS server not response")));

        //Act
        var result = await _sut.GetAllOrdersAsync();

        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("NATS communication error: NATS server not response", result.Errors.First());
    }

    [Fact]
    public async Task GetOrderByIdAsync_WhenOrderExists_ReturnsOkResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        var response = new OrderResponseDto
        {
            Uuid = uuid,
            CustomerId = "Test"
        };
        var jsonResponse = JsonSerializer.Serialize(response);

        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.get",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = jsonResponse }));

        //Act
        var result = await _sut.GetOrderByIdAsync(uuid);

        //Assert
        Assert.True(result.Success);
        Assert.Null(result.Errors);
        Assert.NotNull(result.Data);
        Assert.Equal(uuid, result.Data.Uuid);
        Assert.Equal("Test", result.Data.CustomerId);
    }

    [Fact]
    public async Task GetOrderByIdAsync_WhenOrderNotFound_ReturnsFailResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        var response = "ERROR: Order not found in the database.";

        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.get",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromResult(new NatsMsg<string> { Data = response }));

        //Act
        var result = await _sut.GetOrderByIdAsync(uuid);

        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Order not found in the database.", result.Errors.First());
    }

    [Fact]
    public async Task GetOrderByIdAsync_WhenTimesOut_ReturnsFailResponse()
    {
        //Arrange
        var uuid = Guid.NewGuid();

        _natsClientMock.RequestAsync<string, string>(
            subject: "orders.get",
            data: Arg.Any<string>(),
            cancellationToken: Arg.Any<CancellationToken>()
        ).Returns(ValueTask.FromException<NatsMsg<string>>(new OperationCanceledException()));

        //Act
        var result = await _sut.GetOrderByIdAsync(uuid);

        //Assert
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.NotNull(result.Errors);
        Assert.Equal("Error: Request to NATS timed out. Please try again later.", result.Errors.First());
    }

}