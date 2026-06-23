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
}