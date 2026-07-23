using System.Text.Json;
using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services.Interfaces;
using NATS.Client.Core;
using Swashbuckle.AspNetCore.SwaggerUI;

namespace back_warehouse_bff.Services;

public class OrderNatsService : IOrderService
{
    private readonly INatsClient _natsClient;
    public OrderNatsService(INatsClient natsClient)
    {
        _natsClient = natsClient;
    }
    public async Task<ApiResponse<OrderResponseDto>> AddOrderAsync(OrderRequestDto request)
    {
        try
        {
            var payload = JsonSerializer.Serialize(request);

            var reply = await _natsClient.RequestAsync<string, string>(
                subject: "orders.add",
                data: payload,
                cancellationToken: new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token
            );

            var responseText = reply.Data;

            if (responseText != null && responseText.StartsWith("ERROR:"))
            {
                return ApiResponse<OrderResponseDto>.Fail(responseText.Replace("ERROR: ", ""));
            }

            var order = JsonSerializer.Deserialize<OrderResponseDto>(responseText!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

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
                DateFrom = query.DateFrom,
                DateTo = query.DateTo
            };
            var payload = JsonSerializer.Serialize(natsPayload);
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
            var reply = await _natsClient.RequestAsync<Guid, string>(
                subject: "orders.get",
                data: uuid,
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