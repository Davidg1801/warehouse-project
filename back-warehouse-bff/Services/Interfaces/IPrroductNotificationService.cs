using back_warehouse_bff.Contracts.Responses;

namespace back_warehouse_bff.Services.Interfaces;

public interface IProductNotificationService
{
    Task NotifyTopProductsUpdatedAsync();
    Task NotifyProductUpdatedAsync(ProductResponseDto product);
    Task NotifyProductDeletedAsync(Guid uuid);
    Task NotifyProductsUpdatedAsync();
}