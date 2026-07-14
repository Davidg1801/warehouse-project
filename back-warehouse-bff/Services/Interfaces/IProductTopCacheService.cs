using back_warehouse_bff.Contracts.Responses;

namespace back_warehouse_bff.Services.Interfaces;

public interface IProductTopCacheService
{
    Task IncreaseProductVisitAsync(Guid uuid);

    Task<List<ProductResponseDto>> GetTopProductsFromCacheAsync(int count = 5);
    Task<bool> IsProductInTopAsync(Guid uuid, int count = 5);
    Task UpdateProductDataAsync(ProductResponseDto product);
    Task RemoveProductFromCacheAsync(Guid uuid);
}