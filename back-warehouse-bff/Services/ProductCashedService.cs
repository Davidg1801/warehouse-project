using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services.Interfaces;

namespace back_warehouse_bff.Services;

public class ProductCashedService : IProductService
{
    private readonly IProductService _inner;
    private readonly IProductTopCacheService _cache;

    private readonly IProductNotificationService _notification;

    public ProductCashedService(IProductService inner, IProductTopCacheService cache, IProductNotificationService notification)
    {
        _inner = inner;
        _cache = cache;
        _notification = notification;
    }

    public async Task<ApiResponse<ProductResponseDto>> AddProductAsync(ProductRequestDto request)
    {
        return await _inner.AddProductAsync(request);
    }

    public async Task<ApiResponse<bool>> DeleteProductAsync(Guid uuid)
    {
        return await _inner.DeleteProductAsync(uuid);
    }

    public async Task<PagedResponse<IEnumerable<ProductResponseDto>>> GetAllProductsAsync(ProductQueryDto? query = null)
    {
        return await _inner.GetAllProductsAsync(query);
    }

    public async Task<ApiResponse<ProductResponseDto>> GetProductByIdAsync(Guid uuid)
    {
        await _cache.IncreaseProductVisitAsync(uuid);
        var response = await _inner.GetProductByIdAsync(uuid);
        if (response.Success && response.Data != null)
        {
            bool isTop = await _cache.IsProductInTopAsync(uuid);
            if (isTop)
            {
                await _cache.UpdateProductDataAsync(response.Data);
                await _notification.NotifyTopProductsUpdatedAsync();
            }
        }
        return response;
    }

    public async Task<ApiResponse<ProductResponseDto>> UpdateProductAsync(Guid uuid, ProductRequestDto request)
    {
        return await _inner.UpdateProductAsync(uuid, request);
    }
}