using System.Text.Json;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Hubs;
using back_warehouse_bff.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace back_warehouse_bff.Services;

public class ProductNotificationService : IProductNotificationService
{
    private readonly IHubContext<ProductHub> _hubContext;
    public ProductNotificationService(IHubContext<ProductHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyTopProductsUpdatedAsync()
    {
        await _hubContext.Clients.All.SendAsync("TopProductsUpdated");
    }

    public async Task NotifyProductUpdatedAsync(ProductResponseDto product)
    {
        if (product != null)
        {
            await _hubContext.Clients.All.SendAsync("ProductUpdated", product);
        }
    }

    public async Task NotifyProductDeletedAsync(Guid uuid)
    {
        await _hubContext.Clients.All.SendAsync("ProductDeleted", uuid);
    }
}