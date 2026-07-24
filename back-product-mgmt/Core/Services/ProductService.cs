using Core.Commands;
using Core.Entities;
using Core.Interfaces;
using Core.Queries;
using Core.Results;

namespace Core.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _repository;

    public ProductService(IProductRepository repository)
    {
        _repository = repository;
    }

    public async Task<Product> AddProductAsync(string name, ProductCategory categoryId, decimal price, int quantity)
    {
        var newProduct = Product.CreateProduct(name, categoryId, price, quantity);
        await _repository.AddAsync(newProduct);

        return newProduct;
    }

    public async Task<PagedResult<Product>> GetAllProductsAsync(ProductQuery query)
    {
        //return await _repository.GetAllAsync();
        return await _repository.GetPagedAsync(query);
    }

    public async Task<bool> DeleteProductAsync(Guid uuid)
    {
        try
        {
            bool isDeleted = await _repository.DeleteAsync(uuid);
            return isDeleted;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Critical error: {ex.Message}");
            throw;
        }
    }

    public async Task<Product?> UpdateProductAsync(Guid uuid, string name, ProductCategory categoryId, decimal price, int quantity)
    {
        try
        {
            var product = await _repository.GetByIdAsync(uuid);
            if (product == null)
            {
                return null;
            }
            product.Name = name;
            product.CategoryId = categoryId;
            product.Price = price;
            product.Quantity = quantity;

            var updatedProduct = await _repository.UpdateAsync(uuid, product);

            return updatedProduct;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Critical error: {ex.Message}");
            throw;
        }
    }
    public async Task<Product?> GetProductAsync(Guid uuid)
    {
        return await _repository.GetByIdAsync(uuid);
    }

    public async Task<ReserveStockResult> ReserveStockAsync(ReserveStockCommand command)
    {
        var result = new ReserveStockResult();

        var aggregatedItems = command.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new ReserveStockItem
            {
                ProductId = g.Key,
                Quantity = g.Sum(i => i.Quantity)
            })
            .ToList();

        var productIds = aggregatedItems.Select(i => i.ProductId).ToList();
        var productsResult = await _repository.GetByIdsAsync(productIds);
        var products = productsResult.ToList();

        foreach (var item in command.Items)
        {
            var product = products.FirstOrDefault(p => p.Uuid == item.ProductId);
            if (product == null)
            {
                result.Errors.Add($"Product with UUID {item.ProductId} not found.");
            }
            else if (product.Quantity < item.Quantity)
            {
                result.Errors.Add($"Insufficient quantity for '{product.Name}'. Available: {product.Quantity}, Requested: {item.Quantity}.");
            }
        }
        if (result.Errors.Any())
        {
            result.Success = false;
            return result;
        }

        foreach (var item in command.Items)
        {
            var product = products.First(p => p.Uuid == item.ProductId);
            product.Quantity -= item.Quantity;
        }
        await _repository.UpdateManyAsync(products);
        return result;
    }
}