using Core.Entities;
using Core.Queries;
using Core.Results;

namespace Core.Interfaces;

public interface IProductService
{
    Task<Product> AddProductAsync(string name, ProductCategory categoryId, decimal price, int quantity);
    Task<PagedResult<Product>> GetAllProductsAsync(ProductQuery query);
    Task<bool> DeleteProductAsync(Guid uuid);
    Task<Product?> UpdateProductAsync(Guid uuid, string name, ProductCategory categoryId, decimal price, int quantity);
    Task<Product?> GetProductAsync(Guid uuid);
}