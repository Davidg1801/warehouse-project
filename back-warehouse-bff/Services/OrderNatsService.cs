using System.Text.Json;
using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services.Interfaces;
using Microsoft.VisualBasic;
using NATS.Client.Core;
using Swashbuckle.AspNetCore.SwaggerUI;

namespace back_warehouse_bff.Services;

public class OrderNatsService : IOrderService
{
    private readonly INatsClient _natsClient;
    private readonly IProductNotificationService _notificationService;
    private readonly IProductTopCacheService _topCacheService;
    public OrderNatsService(INatsClient natsClient, IProductNotificationService notificationService, IProductTopCacheService topCacheService)
    {
        _natsClient = natsClient;
        _notificationService = notificationService;
        _topCacheService = topCacheService;
    }
    public async Task<ApiResponse<OrderResponseDto>> AddOrderAsync(OrderRequestDto request)
    {
        try
        {
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var payload = JsonSerializer.Serialize(request, jsonOptions);

            var reply = await _natsClient.RequestAsync<string, string>(
                subject: "orders.add",
                data: payload,
                cancellationToken: new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token
            );

            var responseText = reply.Data;

            if (responseText != null && responseText.StartsWith("ERROR:"))
            {
                var cleanErrorString = responseText.Replace("ERROR: ", "");
                var errorList = cleanErrorString
                    .Split(" | ", StringSplitOptions.RemoveEmptyEntries)
                    .Select(e => e.Trim())
                    .ToList();
                return ApiResponse<OrderResponseDto>.Fail(errorList);
            }

            var order = JsonSerializer.Deserialize<OrderResponseDto>(responseText!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var topProductsChanged = false;
            foreach (var item in order!.Items)
            {
                try
                {
                    var isTop = await _topCacheService.IsProductInTopAsync(item.ProductId);
                    if (isTop)
                    {
                        var productReply = await _natsClient.RequestAsync<Guid, string>("products.get", item.ProductId);
                        if (productReply.Data != null && !productReply.Data.StartsWith("ERROR:"))
                        {
                            var updatedProduct = JsonSerializer.Deserialize<ProductResponseDto>(
                                productReply.Data,
                                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                            );

                            if (updatedProduct != null)
                            {
                                await _topCacheService.UpdateProductDataAsync(updatedProduct);
                                topProductsChanged = true;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] [WARNING] Could not update cache for top product {item.ProductId}. Error: {ex.Message}");
                }

            }
            if (topProductsChanged)
            {
                await _notificationService.NotifyTopProductsUpdatedAsync();
            }
            await _notificationService.NotifyProductsUpdatedAsync();
            return ApiResponse<OrderResponseDto>.Ok(order!, "Order has been successfully created.");
        }
        catch (Exception ex)
        {
            return ApiResponse<OrderResponseDto>.Fail($"Error: {ex.Message}");
        }
    }

    public async Task<PagedResponse<IEnumerable<OrderResponseDto>>> GetAllOrdersAsync(OrderQueryDto? query = null)
    {
        try
        {
            query ??= new OrderQueryDto();

            query.PageNumber ??= 1;
            query.PageSize ??= 10;
            query.Descending ??= false;

            var natsPayload = new
            {
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                Descending = query.Descending,
                OrderBy = query.OrderBy?.ToString(),
                CustomerId = query.CustomerId?.ToString(),
                ProductIds = query.ProductIds?.ToArray(),
                Uuid = query.Uuid,
                ProductName = query.ProductName,
                DateFrom = query.DateFrom,
                DateTo = query.DateTo
            };
            var serializeOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var payload = JsonSerializer.Serialize(natsPayload, serializeOptions);
            var reply = await _natsClient.RequestAsync<string, string>(
                subject: "orders.getall",
                data: payload,
                cancellationToken: new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token
            );

            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var workerResponse = JsonSerializer.Deserialize<WorkerPagedResponse<OrderResponseDto>>(reply.Data!, jsonOptions);

            if (workerResponse == null)
            {
                return new PagedResponse<IEnumerable<OrderResponseDto>> { Success = false, Errors = new List<string> { "Failed to parse NATS response." } };
            }

            return PagedResponse<IEnumerable<OrderResponseDto>>.OkPaged(
                data: workerResponse.Data?.AsEnumerable() ?? Enumerable.Empty<OrderResponseDto>(),
                totalCount: workerResponse.TotalCount,
                pageNumber: query.PageNumber ?? 1,
                pageSize: query.PageSize ?? 10
            );

        }
        catch (OperationCanceledException)
        {
            return PagedResponse<IEnumerable<OrderResponseDto>>.FailPaged("Error: Request to NATS timed out. Please try again later.");
        }
        catch (Exception ex)
        {
            return PagedResponse<IEnumerable<OrderResponseDto>>.FailPaged($"NATS communication error: {ex.Message}");
        }
    }

    public async Task<ApiResponse<OrderResponseDto>> GetOrderByIdAsync(Guid uuid)
    {
        try
        {
            var reply = await _natsClient.RequestAsync<string, string>(
                subject: "orders.get",
                data: uuid.ToString(),
                cancellationToken: new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token
            );

            var responseText = reply.Data;
            if (responseText != null && responseText.StartsWith("ERROR:"))
            {
                return ApiResponse<OrderResponseDto>.Fail(responseText.Replace("ERROR: ", ""));
            }

            var order = JsonSerializer.Deserialize<OrderResponseDto>(responseText!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return ApiResponse<OrderResponseDto>.Ok(order!);
        }
        catch (OperationCanceledException)
        {
            return ApiResponse<OrderResponseDto>.Fail("Error: Request to NATS timed out. Please try again later.");
        }
        catch (Exception ex)
        {
            return ApiResponse<OrderResponseDto>.Fail($"NATS communication error: {ex.Message}");
        }
    }
}