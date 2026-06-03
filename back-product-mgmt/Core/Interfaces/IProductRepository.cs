using Core.Entities;

namespace Core.Interfaces;

public interface IProductRepository
{
    Task<IEnumerable<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(Guid uuid);
    Task AddAsync(Product product);
    Task<bool> DeleteAsync(Guid uuid);
    Task<Product?> UpdateAsync(Guid uuid, Product data);
}