using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace back_warehouse_bff.Hubs;

[Authorize]
public class ProductHub : Hub
{

}