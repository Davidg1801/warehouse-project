using System.Text.Json;
using Core.Services;
using Worker.Contracts.Response;
using NATS.Client.Core;
using Worker.Contracts.Request;
using Worker.Contracts;
using Core.Queries;

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
        var deleteProductTask = ListenForDeleteProduct(stoppingToken);
        var updateProductTask = ListenForUpdateProduct(stoppingToken);
        var getProductTask = ListenForGetProduct(stoppingToken);

        await Task.WhenAll(getAllProductTask, addProductTask, deleteProductTask, updateProductTask, getProductTask);
    }

    private async Task ListenForGetAllProducts(CancellationToken stoppingToken)
    {
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        await foreach (var msg in _natsClient.SubscribeAsync<string>("products.getall", cancellationToken: stoppingToken))
        {
            try
            {
                _logger.LogInformation("Received request:: products.getall");
                var request = JsonSerializer.Deserialize<ProductQueryRequest>(msg.Data ?? "{}", jsonOptions) ?? new ProductQueryRequest();
                var productQuery = new ProductQuery(
                    request.PageNumber,
                    request.PageSize,
                    request.Name,
                    request.CategoryIds,
                    request.Descending,
                    request.OrderBy
                );
                var pagedProducts = await _productService.GetAllProductsAsync(productQuery);

                var responseList = pagedProducts.Data.Select(p => new ProductResponse(
                    p.Uuid,
                    p.Name,
                    p.CategoryId,
                    p.Price,
                    p.Quantity
                )).ToList();

                var responsePayload = new
                {
                    TotalCount = pagedProducts.TotalCount,
                    Data = responseList
                };
                var responseJson = JsonSerializer.Serialize(responsePayload);
                await msg.ReplyAsync(responseJson, cancellationToken: stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during fetching all products");
                var errorPayload = new { Error = ex.Message };
                var errorJson = JsonSerializer.Serialize(errorPayload);
                await msg.ReplyAsync(errorJson, cancellationToken: stoppingToken);
            }

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
                    var product = await _productService.AddProductAsync(request.Name, request.CategoryId, request.Price, request.Quantity);
                    var responseDto = new ProductResponse(product.Uuid, product.Name, product.CategoryId, product.Price, product.Quantity);
                    var responseJson = JsonSerializer.Serialize(responseDto);
                    await msg.ReplyAsync(responseJson, cancellationToken: stoppingToken);
                }
                else
                {
                    await msg.ReplyAsync("ERROR: Request data was null", cancellationToken: stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during adding product");
                await msg.ReplyAsync($"ERROR: {ex.Message}", cancellationToken: stoppingToken);
            }
        }
    }

    private async Task ListenForDeleteProduct(CancellationToken stoppingToken)
    {
        await foreach (var msg in _natsClient.SubscribeAsync<Guid>("products.delete", cancellationToken: stoppingToken))
        {
            try
            {
                _logger.LogInformation($"Received request:: products.delete for UUID: {msg.Data}");
                bool isDeleted = await _productService.DeleteProductAsync(msg.Data);
                await msg.ReplyAsync(isDeleted, cancellationToken: stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during deleting product");
                await msg.ReplyAsync(false, cancellationToken: stoppingToken);
            }
        }
    }

    private async Task ListenForUpdateProduct(CancellationToken stoppingToken)
    {
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        await foreach (var msg in _natsClient.SubscribeAsync<string>("products.update", cancellationToken: stoppingToken))
        {
            try
            {
                var request = JsonSerializer.Deserialize<UpdateProductRequest>(msg.Data!, jsonOptions);
                if (request != null)
                {
                    var product = await _productService.UpdateProductAsync(request.Uuid, request.Name, request.CategoryId, request.Price, request.Quantity);
                    if (product != null)
                    {
                        var responseDto = new ProductResponse(product.Uuid, product.Name, product.CategoryId, product.Price, product.Quantity);
                        var responseJson = JsonSerializer.Serialize(responseDto);
                        await msg.ReplyAsync(responseJson, cancellationToken: stoppingToken);
                    }
                    else
                    {
                        await msg.ReplyAsync("ERROR: Product not found", cancellationToken: stoppingToken);
                    }
                }
                else
                {
                    await msg.ReplyAsync("ERROR: Request data was null", cancellationToken: stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during updating product");
                await msg.ReplyAsync($"ERROR: {ex.Message}", cancellationToken: stoppingToken);
            }

        }
    }

    private async Task ListenForGetProduct(CancellationToken stoppingToken)
    {
        await foreach (var msg in _natsClient.SubscribeAsync<Guid>("products.get", cancellationToken: stoppingToken))
        {
            try
            {
                _logger.LogInformation($"Received request:: products.get for UUID: {msg.Data}");
                var product = await _productService.GetProductAsync(msg.Data);

                if (product != null)
                {
                    var responseDto = new ProductResponse(product.Uuid, product.Name, product.CategoryId, product.Price, product.Quantity);
                    var responseJson = JsonSerializer.Serialize(responseDto);
                    await msg.ReplyAsync(responseJson, cancellationToken: stoppingToken);
                }
                else
                {
                    await msg.ReplyAsync("ERROR: Product not found", cancellationToken: stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during getting product");
                await msg.ReplyAsync($"ERROR: {ex.Message}", cancellationToken: stoppingToken);
            }
        }
    }
}