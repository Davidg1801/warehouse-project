using System.Text.Json;
using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services.Interfaces;
using NATS.Client.Core;
using Swashbuckle.AspNetCore.SwaggerUI;

namespace back_warehouse_bff.Services;

public class ProductNatsService : IProductService
{
    private readonly INatsClient _natsClient;
    public ProductNatsService(INatsClient natsClient)
    {
        _natsClient = natsClient;
    }
    public async Task<ApiResponse<ProductResponseDto>> AddProductAsync(ProductRequestDto request)
    {
        try
        {
            var payload = JsonSerializer.Serialize(request);

            var reply = await _natsClient.RequestAsync<string, string>(
                subject: "products.add",
                data: payload,
                cancellationToken: new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token
            );

            var responseText = reply.Data;

            if (responseText != null && responseText.StartsWith("ERROR:"))
            {
                return ApiResponse<ProductResponseDto>.Fail(responseText.Replace("ERROR: ", ""));
            }

            var product = JsonSerializer.Deserialize<ProductResponseDto>(responseText!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return ApiResponse<ProductResponseDto>.Ok(product!, "Product has been successfully created.");
        }
        catch (Exception ex)
        {
            return ApiResponse<ProductResponseDto>.Fail($"Error: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> DeleteProductAsync(Guid uuid)
    {
        try
        {
            var reply = await _natsClient.RequestAsync<Guid, bool>(
                subject: "products.delete",
                data: uuid,
                cancellationToken: new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token
            );

            if (reply.Data)
            {
                return ApiResponse<bool>.Ok(reply.Data, "Product has been successfully deleted.");
            }

            return ApiResponse<bool>.Fail("Product with the given ID does not exist or could not be deleted.");
        }
        catch (OperationCanceledException ex)
        {
            return ApiResponse<bool>.Fail("Error: Request to Worker timed out. Please try again later.");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.Fail($"NATS communication error: {ex.Message}");
        }
    }

    public async Task<ApiResponse<ProductResponseDto>> UpdateProductAsync(Guid uuid, ProductRequestDto request)
    {
        try
        {
            var updatePayload = new
            {
                Uuid = uuid,
                Name = request.Name,
                CategoryId = request.CategoryId,
                Price = request.Price,
                Quantity = request.Quantity
            };

            var payload = JsonSerializer.Serialize(updatePayload);

            var reply = await _natsClient.RequestAsync<string, string>(
                subject: "products.update",
                data: payload,
                cancellationToken: new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token
            );

            var responseText = reply.Data;

            if (responseText != null && responseText.StartsWith("ERROR:"))
            {
                return ApiResponse<ProductResponseDto>.Fail(responseText.Replace("ERROR: ", ""));
            }

            var product = JsonSerializer.Deserialize<ProductResponseDto>(responseText!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return ApiResponse<ProductResponseDto>.Ok(product!, "Product has been successfully updated.");
        }
        catch (OperationCanceledException)
        {
            return ApiResponse<ProductResponseDto>.Fail("Error: Request to Worker timed out. Please try again later.");
        }
        catch (Exception ex)
        {
            return ApiResponse<ProductResponseDto>.Fail($"NATS communication error: {ex.Message}");
        }
    }

    public async Task<ApiResponse<ProductResponseDto>> GetProductByIdAsync(Guid uuid)
    {
        try
        {
            var reply = await _natsClient.RequestAsync<Guid, string>(
                subject: "products.get",
                data: uuid,
                cancellationToken: new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token
            );

            var responseText = reply.Data;
            if (responseText != null && responseText.StartsWith("ERROR:"))
            {
                return ApiResponse<ProductResponseDto>.Fail(responseText.Replace("ERROR: ", ""));
            }

            var product = JsonSerializer.Deserialize<ProductResponseDto>(responseText!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return ApiResponse<ProductResponseDto>.Ok(product!);
        }
        catch (OperationCanceledException)
        {
            return ApiResponse<ProductResponseDto>.Fail("Error: Request to Worker timed out. Please try again later.");
        }
        catch (Exception ex)
        {
            return ApiResponse<ProductResponseDto>.Fail($"NATS communication error: {ex.Message}");
        }
    }

    public async Task<PagedResponse<IEnumerable<ProductResponseDto>>> GetAllProductsAsync(ProductQueryDto? query = null)
    {
        try
        {
            query ??= new ProductQueryDto();

            query.PageNumber ??= 1;
            query.PageSize ??= 10;
            query.Descending ??= false;

            var payload = JsonSerializer.Serialize(query);
            var reply = await _natsClient.RequestAsync<string, string>(
                subject: "products.getall",
                data: payload,
                cancellationToken: new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token
            );

            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var workerResponse = JsonSerializer.Deserialize<WorkerPagedResponse<ProductResponseDto>>(reply.Data!, jsonOptions);

            if (workerResponse == null)
            {
                return new PagedResponse<IEnumerable<ProductResponseDto>> { Success = false, Errors = new List<string> { "Failed to parse worker response." } };
            }

            return PagedResponse<IEnumerable<ProductResponseDto>>.OkPaged(
                data: workerResponse.Data?.AsEnumerable() ?? Enumerable.Empty<ProductResponseDto>(),
                totalCount: workerResponse.TotalCount,
                pageNumber: query.PageNumber ?? 1,
                pageSize: query.PageSize ?? 10
            );

        }
        catch (OperationCanceledException)
        {
            return PagedResponse<IEnumerable<ProductResponseDto>>.FailPaged("Error: Request to Worker timed out. Please try again later.");
        }
        catch (Exception ex)
        {
            return PagedResponse<IEnumerable<ProductResponseDto>>.FailPaged($"NATS communication error: {ex.Message}");
        }
    }
}