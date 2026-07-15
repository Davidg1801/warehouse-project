using System.Text.Json;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services.Interfaces;
using NATS.Client.Core;

namespace back_warehouse_bff.Services;

public class ProductNatsListenerService : BackgroundService
{
    private readonly INatsClient _natsClient;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ProductNatsListenerService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public ProductNatsListenerService(INatsClient natsClient, IServiceScopeFactory scopeFactory, ILogger<ProductNatsListenerService> logger)
    {
        _natsClient = natsClient;
        _scopeFactory = scopeFactory;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ProductNatsListener running and listening...");
        var deleteProductTask = ListenForDeleteProduct(stoppingToken);
        var updateProductTask = ListenForUpdateProduct(stoppingToken);

        await Task.WhenAll(deleteProductTask, updateProductTask);
    }

    private async Task ListenForUpdateProduct(CancellationToken stoppingToken)
    {
        await foreach (var msg in _natsClient.SubscribeAsync<string>("product.event.updated", cancellationToken: stoppingToken))
        {
            try
            {
                _logger.LogInformation($"Event handler product.event.updated:: {msg.Data}");
                var product = JsonSerializer.Deserialize<ProductResponseDto>(msg.Data ?? "{}", _jsonOptions);

                if (product != null)
                {
                    using var scope = _scopeFactory.CreateScope();
                    var notificationService = scope.ServiceProvider.GetRequiredService<IProductNotificationService>();
                    var cacheService = scope.ServiceProvider.GetRequiredService<IProductTopCacheService>();

                    bool isTop = await cacheService.IsProductInTopAsync(product.Uuid);
                    await notificationService.NotifyProductUpdatedAsync(product);
                    if (isTop)
                    {
                        await cacheService.UpdateProductDataAsync(product);
                        await notificationService.NotifyTopProductsUpdatedAsync();
                    }
                }
                else
                {
                    _logger.LogError("Error during deserialisation object");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during update product processing");
            }
        }
    }

    private async Task ListenForDeleteProduct(CancellationToken stoppingToken)
    {
        await foreach (var msg in _natsClient.SubscribeAsync<Guid>("product.event.deleted", cancellationToken: stoppingToken))
        {
            try
            {
                _logger.LogInformation($"Event handler product.event.deleted:: {msg.Data}");
                using var scope = _scopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<IProductNotificationService>();
                var cacheService = scope.ServiceProvider.GetRequiredService<IProductTopCacheService>();
                bool wasInTop = await cacheService.IsProductInTopAsync(msg.Data);
                await cacheService.RemoveProductFromCacheAsync(msg.Data);
                await notificationService.NotifyProductDeletedAsync(msg.Data);
                if (wasInTop)
                {
                    await notificationService.NotifyTopProductsUpdatedAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during update product processing");
            }
        }
    }
}