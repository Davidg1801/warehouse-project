using System.Text.Json;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services.Interfaces;
using StackExchange.Redis;

namespace back_warehouse_bff.Services.Cache;

public class TopProductValkeyCacheService : IProductTopCacheService
{
    private readonly IConnectionMultiplexer _valkey;
    private readonly JsonSerializerOptions _jsonOptions;
    private const string RankingKey = "products:ranking";
    private const string ProductKeyPrefix = "product:";

    public TopProductValkeyCacheService(IConnectionMultiplexer valkey)
    {
        _valkey = valkey;
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    }

    public async Task<List<ProductResponseDto>> GetTopProductsFromCacheAsync(int count = 5)
    {
        var db = _valkey.GetDatabase();
        var topUuids = await db.SortedSetRangeByRankAsync(RankingKey, 0, count - 1, Order.Descending);
        var topProducts = new List<ProductResponseDto>();
        foreach (var valkeyValue in topUuids)
        {
            string cacheKey = $"{ProductKeyPrefix}{valkeyValue}";
            var jsonString = await db.StringGetAsync(cacheKey);
            if (!jsonString.IsNullOrEmpty)
            {
                var product = JsonSerializer.Deserialize<ProductResponseDto>((string)jsonString!, _jsonOptions);
                if (product != null)
                {
                    topProducts.Add(product);
                }
            }
        }
        return topProducts;
    }

    public async Task IncreaseProductVisitAsync(Guid uuid)
    {
        var db = _valkey.GetDatabase();
        await db.SortedSetIncrementAsync(RankingKey, uuid.ToString(), 1);
    }

    public async Task<bool> IsProductInTopAsync(Guid uuid, int count = 5)
    {
        var db = _valkey.GetDatabase();
        var topUuids = await db.SortedSetRangeByRankAsync(RankingKey, 0, count - 1, Order.Descending);
        var uuidString = uuid.ToString();
        return topUuids.ToStringArray().Contains(uuidString);
    }

    public async Task RemoveProductFromCacheAsync(Guid uuid)
    {
        var db = _valkey.GetDatabase();
        string cacheKey = $"{ProductKeyPrefix}{uuid}";
        await db.SortedSetRemoveAsync(RankingKey, uuid.ToString());
        await db.KeyDeleteAsync(cacheKey);
    }

    public async Task UpdateProductDataAsync(ProductResponseDto product)
    {
        var db = _valkey.GetDatabase();
        string cacheKey = $"{ProductKeyPrefix}{product.Uuid}";
        var jsonString = JsonSerializer.Serialize(product, _jsonOptions);
        await db.StringSetAsync(cacheKey, jsonString);
    }
}