using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Hubs;
using back_warehouse_bff.Services;
using Microsoft.AspNetCore.SignalR;
using NSubstitute;

namespace back_warehouse_bff.Tests.Services;

public class ProductNotificationServiceTests
{
    private readonly IHubContext<ProductHub> _hubContextMock;
    private readonly IHubClients _hubClientsMock;
    private readonly IClientProxy _clientProxyMock;
    private readonly ProductNotificationService _sut;

    public ProductNotificationServiceTests()
    {
        _hubContextMock = Substitute.For<IHubContext<ProductHub>>();
        _hubClientsMock = Substitute.For<IHubClients>();
        _clientProxyMock = Substitute.For<IClientProxy>();

        _hubClientsMock.All.Returns(_clientProxyMock);
        _hubContextMock.Clients.Returns(_hubClientsMock);

        _sut = new ProductNotificationService(_hubContextMock);
    }

    [Fact]
    public async Task NotifyTopProductsUpdatedAsync_SendsCorrectMessageToAllClients()
    {
        //Act
        await _sut.NotifyTopProductsUpdatedAsync();

        //Assert
        await _clientProxyMock.Received(1).SendCoreAsync(
            "TopProductsUpdated",
            Arg.Is<object[]>(args => args.Length == 0),
            Arg.Any<CancellationToken>()
        );
    }

    [Fact]
    public async Task NotifyProductsUpdatedAsync_SendsCorrectMessageToAllClients()
    {
        //Act
        await _sut.NotifyProductsUpdatedAsync();

        //Assert
        await _clientProxyMock.Received(1).SendCoreAsync(
            "ProductsUpdated",
            Arg.Is<object[]>(args => args.Length == 0),
            Arg.Any<CancellationToken>()
        );
    }

    [Fact]
    public async Task NotifyProductDeletedAsync_WhenCalled_SendsMessageWithUuid()
    {
        //Arrange
        var uuid = Guid.NewGuid();

        //Act
        await _sut.NotifyProductDeletedAsync(uuid);

        //Assert
        await _clientProxyMock.Received(1).SendCoreAsync(
            "ProductDeleted",
            Arg.Is<object[]>(args => args.Length == 1 && (Guid)args[0] == uuid),
            Arg.Any<CancellationToken>()
        );
    }

    [Fact]
    public async Task NotifyProductUpdatedAsync_WhenProductIsNotNull_SendsMessageWithProduct()
    {
        //Arrange
        var product = new ProductResponseDto { Uuid = Guid.NewGuid(), Name = "Prod1", CategoryId = ProductCategory.ComputerCases, Price = 100m, Quantity = 10 };

        //Act
        await _sut.NotifyProductUpdatedAsync(product);

        //Assert
        await _clientProxyMock.Received(1).SendCoreAsync(
            "ProductUpdated",
            Arg.Is<object[]>(args => args.Length == 1 && args[0] == product),
            Arg.Any<CancellationToken>()
        );
    }

    [Fact]
    public async Task NotifyProductUpdatedAsync_WhenProductIsNull_DoesNotSendMessage()
    {
        //Act
        await _sut.NotifyProductUpdatedAsync(null!);

        // Assert
        await _clientProxyMock.DidNotReceive().SendCoreAsync(
            Arg.Any<string>(),
            Arg.Any<object[]>(),
            Arg.Any<CancellationToken>()
        );
    }
}