using System.ComponentModel.DataAnnotations;
using back_warehouse_bff.Hubs;

namespace back_warehouse_bff.Endpoints;

public static class WebSocketEndpoints
{
    public static void MapWebSocketEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapHub<ProductHub>("/websocket/products");
    }
}