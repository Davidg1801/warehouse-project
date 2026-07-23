using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;

namespace back_warehouse_bff.Services.Interfaces;

public interface IOrderService
{
    Task<ApiResponse<OrderResponseDto>> AddOrderAsync(OrderRequestDto request);
    Task<ApiResponse<OrderResponseDto>> GetOrderByIdAsync(Guid uuid);
    Task<PagedResponse<IEnumerable<OrderResponseDto>>> GetAllOrdersAsync(OrderQueryDto? query = null);
}