using Core.Entities;

namespace Core.Interfaces;

public interface IProductRepository
{
    Task<IEnumerable<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(Guid uuid);
    Task AddAsync(Product product);
    Task DeleteAsync(Guid uuid);
}