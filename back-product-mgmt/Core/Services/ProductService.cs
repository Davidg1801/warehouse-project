using Core.Entities;
using Core.Interfaces;

namespace Core.Services;

public class ProductService
{
    private readonly IProductRepository _repository;

    public ProductService(IProductRepository repository)
    {
        _repository = repository;
    }

    public async Task AddProductAsync(string name, ProductCategory categoryId, decimal price, int quantity)
    {
        var newProduct = Product.CreateProduct(name, categoryId, price, quantity);
        await _repository.AddAsync(newProduct);
    }

    public async Task<IEnumerable<Product>> GetAllProductsAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task DeleteProductAsync(Guid uuid)
    {
        var product = await _repository.GetByIdAsync(uuid);
        if (product != null)
        {
            await _repository.DeleteAsync(uuid);
        }
    }

    public async Task<Product?> GetProductAsync(Guid uuid)
    {
        return await _repository.GetByIdAsync(uuid);
    }

}