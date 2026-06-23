using System.Text.Json;
using Core.Entities;
using Core.Interfaces;
using Core.Queries;
using Core.Results;
using Microsoft.Extensions.Caching.Distributed;

namespace Infrastructure.Data;

public class CashedProductRepository : IProductRepository
{
    private readonly IProductRepository _innerRepository;
    private readonly IDistributedCache _cache;
    private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions()
    {
        PropertyNameCaseInsensitive = true
    };

    public CashedProductRepository(IProductRepository innerRepository, IDistributedCache cache)
    {
        _innerRepository = innerRepository;
        _cache = cache;
    }

    public async Task<Product?> GetByIdAsync(Guid uuid)
    {
        string cacheKey = $"product:{uuid}";

        var cashedProductJson = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cashedProductJson))
        {
            return JsonSerializer.Deserialize<Product>(cashedProductJson, _jsonOptions);
        }

        var product = await _innerRepository.GetByIdAsync(uuid);

        if (product != null)
        {
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            };
            var productJson = JsonSerializer.Serialize(product, _jsonOptions);
            await _cache.SetStringAsync(cacheKey, productJson, cacheOptions);
        }
        return product;
    }

    public async Task AddAsync(Product product)
    {
        await _innerRepository.AddAsync(product);
    }

    public async Task<Product?> UpdateAsync(Guid uuid, Product data)
    {
        var updatedProduct = await _innerRepository.UpdateAsync(uuid, data);
        if (updatedProduct != null)
        {
            string cacheKey = $"product:{uuid}";
            var jsonProduct = JsonSerializer.Serialize(updatedProduct, _jsonOptions);
            await _cache.SetStringAsync(cacheKey, jsonProduct);
        }

        return updatedProduct;
    }

    public async Task<PagedResult<Product>> GetPagedAsync(ProductQuery query)
    {
        return await _innerRepository.GetPagedAsync(query);
    }

    public async Task<bool> DeleteAsync(Guid uuid)
    {
        var isDeleted = await _innerRepository.DeleteAsync(uuid);

        if (isDeleted)
        {
            await _cache.RemoveAsync($"product:{uuid}");
        }
        return isDeleted;
    }
}
