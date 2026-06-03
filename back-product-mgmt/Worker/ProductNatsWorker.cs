using System.Text.Json;
using Core.Services;
using Worker.Contracts.Response;
using NATS.Client.Core;
using Worker.Contracts.Request;

namespace Worker;

public class ProductNatsWorker : BackgroundService
{
    private readonly INatsClient _natsClient;
    private readonly ProductService _productService;

    private readonly ILogger<ProductNatsWorker> _logger;

    public ProductNatsWorker(INatsClient natsClient, ProductService productService, ILogger<ProductNatsWorker> logger)
    {
        _natsClient = natsClient;
        _productService = productService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Worker NATS running...");

        var getAllProductTask = ListenForGetAllProducts(stoppingToken);
        var addProductTask = ListenForAddProducts(stoppingToken);

        await Task.WhenAll(getAllProductTask, addProductTask);
    }

    private async Task ListenForGetAllProducts(CancellationToken stoppingToken)
    {
        await foreach (var msg in _natsClient.SubscribeAsync<string>("products.getall", cancellationToken: stoppingToken))
        {
            _logger.LogInformation("Received request:: products.getall");

            var products = await _productService.GetAllProductsAsync();

            var responseList = products.Select(p => new ProductResponse(
                p.Uuid,
                p.Name,
                p.CategoryId,
                p.Price,
                p.Quantity
            )).ToList();

            var jsonResponse = JsonSerializer.Serialize(responseList);
            await msg.ReplyAsync(jsonResponse, cancellationToken: stoppingToken);
        }
    }

    private async Task ListenForAddProducts(CancellationToken stoppingToken)
    {
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        await foreach (var msg in _natsClient.SubscribeAsync<string>("products.add", cancellationToken: stoppingToken))
        {
            try
            {
                _logger.LogInformation("Received request:: products.add");
                var request = JsonSerializer.Deserialize<AddProductRequest>(msg.Data!, jsonOptions);
                if (request != null)
                {
                    await _productService.AddProductAsync(request.Name, request.CategoryId, request.Price, request.Quantity);
                }
                await msg.ReplyAsync("SUCCESS: Product has been added", cancellationToken: stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during adding product");
                await msg.ReplyAsync($"ERROR: {ex.Message}", cancellationToken: stoppingToken);
            }
        }
    }
}