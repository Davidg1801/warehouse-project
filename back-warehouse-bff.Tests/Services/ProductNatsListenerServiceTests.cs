using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using NATS.Client.Core;
using back_warehouse_bff.Services;
using NSubstitute;
using System.Runtime.CompilerServices;
using back_warehouse_bff.Services.Interfaces;
using back_warehouse_bff.Contracts.Responses;

namespace back_warehouse_bff.Tests.Services;

public class ProductNatsListenerServiceTests
{
    private readonly INatsClient _natsClientMock;
    private readonly IServiceScopeFactory _scopeFactoryMock;
    private readonly ILogger<ProductNatsListenerService> _loggerMock;
    private readonly TestableProductNatsListenerService _sut;

    private readonly IProductNotificationService _notificationServiceMock;
    private readonly IProductTopCacheService _cacheServiceMock;

    public ProductNatsListenerServiceTests()
    {
        _natsClientMock = Substitute.For<INatsClient>();
        _scopeFactoryMock = Substitute.For<IServiceScopeFactory>();
        _loggerMock = Substitute.For<ILogger<ProductNatsListenerService>>();

        _notificationServiceMock = Substitute.For<IProductNotificationService>();
        _cacheServiceMock = Substitute.For<IProductTopCacheService>();

        var scopeMock = Substitute.For<IServiceScope>();
        var serviceProviderMock = Substitute.For<IServiceProvider>();
        _scopeFactoryMock.CreateScope().Returns(scopeMock);
        scopeMock.ServiceProvider.Returns(serviceProviderMock);
        serviceProviderMock.GetService(typeof(IProductNotificationService)).Returns(_notificationServiceMock);
        serviceProviderMock.GetService(typeof(IProductTopCacheService)).Returns(_cacheServiceMock);

        _sut = new TestableProductNatsListenerService(_natsClientMock, _scopeFactoryMock, _loggerMock);
    }

    private async IAsyncEnumerable<NatsMsg<T>> MockSingleMessageStream<T>(T payload, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        yield return new NatsMsg<T> { Data = payload, Subject = "test.subject" };
        await Task.CompletedTask;
    }

    private async IAsyncEnumerable<NatsMsg<T>> MockEmptyStream<T>([EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        yield break;
    }

    [Fact]
    public async Task ExecuteAsync_WhenUpdateEventReceivedAndProductIsInTop_UpdatesCacheAndNotifies()
    {
        // Arrange
        var product = new ProductResponseDto { Uuid = Guid.NewGuid(), Name = "RAM" };
        var jsonPayload = JsonSerializer.Serialize(product);

        _natsClientMock.SubscribeAsync<string>("product.event.updated", cancellationToken: Arg.Any<CancellationToken>())
            .Returns(MockSingleMessageStream(jsonPayload));

        _natsClientMock.SubscribeAsync<Guid>("product.event.deleted", cancellationToken: Arg.Any<CancellationToken>())
            .Returns(MockEmptyStream<Guid>());

        _cacheServiceMock.IsProductInTopAsync(product.Uuid).Returns(true);

        // Act
        await _sut.RunExecuteAsync(CancellationToken.None);

        // Assert
        await _notificationServiceMock.Received(1).NotifyProductUpdatedAsync(Arg.Is<ProductResponseDto>(p => p.Uuid == product.Uuid));
        await _cacheServiceMock.Received(1).UpdateProductDataAsync(Arg.Is<ProductResponseDto>(p => p.Uuid == product.Uuid));
        await _notificationServiceMock.Received(1).NotifyTopProductsUpdatedAsync();
    }

    private class TestableProductNatsListenerService : ProductNatsListenerService
    {
        public TestableProductNatsListenerService(INatsClient natsClient, IServiceScopeFactory scopeFactory, ILogger<ProductNatsListenerService> logger)
            : base(natsClient, scopeFactory, logger)
        {
        }

        public Task RunExecuteAsync(CancellationToken token)
        {
            return ExecuteAsync(token);
        }
    }

}