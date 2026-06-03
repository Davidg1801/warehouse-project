using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;

namespace back_warehouse_bff.Services.Interfaces;

public interface IProductService
{
    Task<ApiResponse<ProductResponseDto>> AddProductAsync(ProductRequestDto request);

    Task<ApiResponse<bool>> DeleteProductAsync(Guid uuid);

    Task<ApiResponse<ProductResponseDto>> UpdateProductAsync(Guid uuid, ProductRequestDto request);

    Task<ApiResponse<ProductResponseDto>> GetProductByIdAsync(Guid uuid);

    Task<ApiResponse<IEnumerable<ProductResponseDto>>> GetAllProductsAsync();

}