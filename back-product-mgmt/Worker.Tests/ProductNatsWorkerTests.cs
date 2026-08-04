using System.Text.Json;
using System.Runtime.CompilerServices;
using Microsoft.Extensions.Logging;
using Worker;
using Core.Services;
using Core.Queries;
using NATS.Client.Core;
using NSubstitute;
using Xunit;
using Core.Interfaces;
using Core.Entities;
using Worker.Contracts.Response;
using Core.Commands;
using Core.Results;

namespace Worker.Tests;

public class ProductNatsWorkerTests
{
    private readonly INatsClient _natsClientMock;
    private readonly IProductService _productServiceMock;
    private readonly ILogger<ProductNatsWorker> _loggerMock;
    private readonly ProductNatsWorker _sut;

    public ProductNatsWorkerTests()
    {
        _natsClientMock = Substitute.For<INatsClient>();
        _productServiceMock = Substitute.For<IProductService>();

        _loggerMock = Substitute.For<ILogger<ProductNatsWorker>>();

        _sut = new ProductNatsWorker(_natsClientMock, _productServiceMock, _loggerMock);
    }

    private async IAsyncEnumerable<NatsMsg<T>> MockSingleMessageStream<T>(T payload, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        yield return new NatsMsg<T> { Data = payload, Subject = "test.subject" };
        await Task.CompletedTask;
    }

    [Fact]
    public async Task ExecuteAsync_WhenGetAllProducts_MapsToQueryAndInvokesService()
    {
        // Arrange
        var cts = new CancellationTokenSource();

        var incomingQuery = new { PageNumber = 2, PageSize = 10, Name = "Laptop" };
        var incomingDataJson = JsonSerializer.Serialize(incomingQuery);

        var response = new Core.Results.PagedResult<Core.Entities.Product>
        (
            0,
            new List<Core.Entities.Product>()
        );

        _productServiceMock.GetAllProductsAsync(Arg.Any<ProductQuery>()).Returns(response);

        _natsClientMock.SubscribeAsync<string>("products.getall", cancellationToken: Arg.Any<CancellationToken>())
            .Returns(MockSingleMessageStream(incomingDataJson, cts.Token));

        _natsClientMock
             .SubscribeAsync<Guid>(Arg.Any<string>(), cancellationToken: Arg.Any<CancellationToken>())
             .Returns(AsyncEnumerable.Empty<NatsMsg<Guid>>());

        _natsClientMock
            .SubscribeAsync<string>(Arg.Is<string>(s => s != "products.getall"), cancellationToken: Arg.Any<CancellationToken>())
            .Returns(AsyncEnumerable.Empty<NatsMsg<string>>());

        // Act
        try
        {
            await _sut.StartAsync(cts.Token);
            await Task.Delay(100);
            await _sut.StopAsync(cts.Token);
        }
        catch (NullReferenceException)
        {
        }

        // Assert
        await _productServiceMock.Received(1).GetAllProductsAsync(
            Arg.Is<ProductQuery>(q => q.PageNumber == 2 && q.PageSize == 10 && q.Name == "Laptop")
        );
    }

    [Fact]
    public async Task ExecuteAsync_WhenAddProduct_MapsToRequestAndInvokesService()
    {
        //Arrange
        var cts = new CancellationTokenSource();

        var incomingRequest = new { Name = "Prod1", CategoryId = ProductCategory.Keyboards, Price = 150.50m, Quantity = 10 };
        var incomingDataJson = JsonSerializer.Serialize(incomingRequest);

        var newProduct = new Product(Guid.NewGuid(), "Prod1", ProductCategory.Keyboards, 150.50m, 10);

        _productServiceMock.AddProductAsync(Arg.Any<string>(), Arg.Any<ProductCategory>(), Arg.Any<decimal>(), Arg.Any<int>())
            .Returns(newProduct);

        _natsClientMock.SubscribeAsync<string>("products.add", cancellationToken: Arg.Any<CancellationToken>())
            .Returns(MockSingleMessageStream(incomingDataJson, cts.Token));

        _natsClientMock.SubscribeAsync<Guid>(Arg.Any<string>(), cancellationToken: Arg.Any<CancellationToken>())
             .Returns(AsyncEnumerable.Empty<NatsMsg<Guid>>());

        _natsClientMock.SubscribeAsync<string>(Arg.Is<string>(s => s != "products.add"), cancellationToken: Arg.Any<CancellationToken>())
            .Returns(AsyncEnumerable.Empty<NatsMsg<string>>());

        //Act
        try
        {
            await _sut.StartAsync(cts.Token);
            await Task.Delay(100);
            await _sut.StopAsync(cts.Token);
        }
        catch (NullReferenceException) { }

        //Assert
        await _productServiceMock.Received(1).AddProductAsync("Prod1", ProductCategory.Keyboards, 150.50m, 10);
    }

    [Fact]
    public async Task ExecuteAsync_WhenDeleteProduct_InvokesServiceAndPublishesEvent()
    {
        //Arrange
        var cts = new CancellationTokenSource();
        var productId = Guid.NewGuid();

        _productServiceMock.DeleteProductAsync(productId).Returns(true);
        _natsClientMock.SubscribeAsync<Guid>("products.delete", cancellationToken: Arg.Any<CancellationToken>())
            .Returns(MockSingleMessageStream(productId, cts.Token));

        _natsClientMock.SubscribeAsync<Guid>(Arg.Is<string>(s => s != "products.delete"), cancellationToken: Arg.Any<CancellationToken>())
             .Returns(AsyncEnumerable.Empty<NatsMsg<Guid>>());
        _natsClientMock.SubscribeAsync<string>(Arg.Any<string>(), cancellationToken: Arg.Any<CancellationToken>())
            .Returns(AsyncEnumerable.Empty<NatsMsg<string>>());

        //Act
        try
        {
            await _sut.StartAsync(cts.Token);
            await Task.Delay(100);
            await _sut.StopAsync(cts.Token);
        }
        catch (NullReferenceException) { }

        //Assert
        await _productServiceMock.Received(1).DeleteProductAsync(productId);
        await _natsClientMock.Received(1).PublishAsync("product.event.deleted", productId, cancellationToken: Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ExecuteAsync_WhenUpdateProduct_InvokesServiceAndPublishesEvent()
    {
        //Arrange
        var cts = new CancellationTokenSource();
        var productId = Guid.NewGuid();

        var incomingRequest = new { Uuid = productId, Name = "Prod1", CategoryId = ProductCategory.Keyboards, Price = 200m, Quantity = 5 };
        var incomingDataJson = JsonSerializer.Serialize(incomingRequest);

        var updatedProduct = new Product(productId, "Prod1", ProductCategory.Keyboards, 200m, 5);

        _productServiceMock.UpdateProductAsync(productId, "Prod1", ProductCategory.Keyboards, 200m, 5)
            .Returns(updatedProduct);

        _natsClientMock.SubscribeAsync<string>("products.update", cancellationToken: Arg.Any<CancellationToken>())
            .Returns(MockSingleMessageStream(incomingDataJson, cts.Token));

        _natsClientMock.SubscribeAsync<Guid>(Arg.Any<string>(), cancellationToken: Arg.Any<CancellationToken>())
             .Returns(AsyncEnumerable.Empty<NatsMsg<Guid>>());

        _natsClientMock.SubscribeAsync<string>(Arg.Is<string>(s => s != "products.update"), cancellationToken: Arg.Any<CancellationToken>())
            .Returns(AsyncEnumerable.Empty<NatsMsg<string>>());

        //Act
        try
        {
            await _sut.StartAsync(cts.Token);
            await Task.Delay(100);
            await _sut.StopAsync(cts.Token);
        }
        catch (NullReferenceException) { }

        //Assert
        await _productServiceMock.Received(1).UpdateProductAsync(productId, "Prod1", ProductCategory.Keyboards, 200m, 5);
        await _natsClientMock.Received(1).PublishAsync("product.event.updated", Arg.Any<ProductResponse>(), cancellationToken: Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task ExecuteAsync_WhenGetProduct_InvokesService()
    {
        //Arrange
        var cts = new CancellationTokenSource();
        var productId = Guid.NewGuid();

        var product = new Product(productId, "Prod1", ProductCategory.Keyboards, 100m, 1);
        _productServiceMock.GetProductAsync(productId).Returns(product);

        _natsClientMock.SubscribeAsync<Guid>("products.get", cancellationToken: Arg.Any<CancellationToken>())
            .Returns(MockSingleMessageStream(productId, cts.Token));

        _natsClientMock.SubscribeAsync<Guid>(Arg.Is<string>(s => s != "products.get"), cancellationToken: Arg.Any<CancellationToken>())
             .Returns(AsyncEnumerable.Empty<NatsMsg<Guid>>());

        _natsClientMock.SubscribeAsync<string>(Arg.Any<string>(), cancellationToken: Arg.Any<CancellationToken>())
            .Returns(AsyncEnumerable.Empty<NatsMsg<string>>());

        //Act
        try
        {
            await _sut.StartAsync(cts.Token);
            await Task.Delay(100);
            await _sut.StopAsync(cts.Token);
        }
        catch (NullReferenceException) { }

        //Assert
        await _productServiceMock.Received(1).GetProductAsync(productId);
    }

    [Fact]
    public async Task ExecuteAsync_WhenReserveStock_MapsToCommandAndInvokesService()
    {
        //Arrange
        var cts = new CancellationTokenSource();
        var productId = Guid.NewGuid();

        var incomingRequest = new
        {
            Items = new[] { new { ProductId = productId, Quantity = 2 } }
        };
        var incomingDataJson = JsonSerializer.Serialize(incomingRequest);

        var serviceResult = new ReserveStockResult { Success = true, Errors = new List<string>() };

        _productServiceMock.ReserveStockAsync(Arg.Any<ReserveStockCommand>()).Returns(Task.FromResult(serviceResult));

        _natsClientMock.SubscribeAsync<string>("products.reserve", cancellationToken: Arg.Any<CancellationToken>())
            .Returns(MockSingleMessageStream(incomingDataJson, cts.Token));

        _natsClientMock.SubscribeAsync<Guid>(Arg.Any<string>(), cancellationToken: Arg.Any<CancellationToken>())
             .Returns(AsyncEnumerable.Empty<NatsMsg<Guid>>());
        _natsClientMock.SubscribeAsync<string>(Arg.Is<string>(s => s != "products.reserve"), cancellationToken: Arg.Any<CancellationToken>())
            .Returns(AsyncEnumerable.Empty<NatsMsg<string>>());

        //Act
        try
        {
            await _sut.StartAsync(cts.Token);
            await Task.Delay(100);
            await _sut.StopAsync(cts.Token);
        }
        catch (NullReferenceException) { }

        //Assert
        await _productServiceMock.Received(1).ReserveStockAsync(
            Arg.Is<ReserveStockCommand>(c =>
                c.Items.Count == 1 &&
                c.Items.First().ProductId == productId &&
                c.Items.First().Quantity == 2
            )
        );
    }
}