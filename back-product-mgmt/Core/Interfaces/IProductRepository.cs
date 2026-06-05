using Core.Entities;
using Core.Queries;
using Core.Results;

namespace Core.Interfaces;

public interface IProductRepository
{
    //Task<IEnumerable<Product>> GetAllAsync();
    Task<PagedResult<Product>> GetPagedAsync(ProductQuery query);
    Task<Product?> GetByIdAsync(Guid uuid);
    Task AddAsync(Product product);
    Task<bool> DeleteAsync(Guid uuid);
    Task<Product?> UpdateAsync(Guid uuid, Product data);
}