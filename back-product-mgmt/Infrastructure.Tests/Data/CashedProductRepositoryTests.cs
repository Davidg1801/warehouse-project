using System.Text.Json;
using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
using NSubstitute.ReceivedExtensions;
using Testcontainers.Redis;

namespace Infrastructure.Tests.Data;

public class CashedProductRepositoryTests : IAsyncLifetime
{
    private readonly IProductRepository _innerRepositoryMock;
    private readonly RedisContainer _cacheContainer;
    private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions()
    {
        PropertyNameCaseInsensitive = true
    };
    private CashedProductRepository _sut = null!;
    private IDistributedCache _realRedisCache = null!;



    public CashedProductRepositoryTests()
    {
        _innerRepositoryMock = Substitute.For<IProductRepository>();

        _cacheContainer = new RedisBuilder("redis:alpine").Build();
    }

    public async Task DisposeAsync()
    {
        await _cacheContainer.DisposeAsync();
    }

    public async Task InitializeAsync()
    {
        await _cacheContainer.StartAsync();

        string redisConnectionString = _cacheContainer.GetConnectionString();
        var options = Options.Create(new RedisCacheOptions
        {
            Configuration = redisConnectionString
        });
        _realRedisCache = new RedisCache(options);
        _sut = new CashedProductRepository(_innerRepositoryMock, _realRedisCache);
    }

    [Fact]
    public async Task GetByIdAsync_WhenUuidIsFoundInCache_ReturnProduct()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        string cacheKey = $"product:{uuid}";
        var testProduct = new Product(uuid, "Test", ProductCategory.GraphicsCards, 10.99m, 1);
        var testProductJson = JsonSerializer.Serialize(testProduct, _jsonOptions);
        await _realRedisCache.SetStringAsync(cacheKey, testProductJson);
        //Act
        var result = await _sut.GetByIdAsync(uuid);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(uuid, result.Uuid);
        Assert.Equal(testProduct.Name, result.Name);
        Assert.Equal(testProduct.CategoryId, result.CategoryId);
        Assert.Equal(testProduct.Quantity, result.Quantity);
        Assert.Equal(testProduct.Price, result.Price);
        await _innerRepositoryMock.DidNotReceive().GetByIdAsync(uuid);
    }

    [Fact]
    public async Task GetByIdAsync_WhenUuidIsNotFoundInCache_ReturnProduct()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        string cacheKey = $"product:{uuid}";
        var testProduct = new Product(uuid, "Test", ProductCategory.GraphicsCards, 10.99m, 1);
        _innerRepositoryMock.GetByIdAsync(uuid).Returns<Product?>(testProduct);
        //Act
        var result = await _sut.GetByIdAsync(uuid);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(uuid, result.Uuid);
        Assert.Equal(testProduct.Name, result.Name);
        Assert.Equal(testProduct.CategoryId, result.CategoryId);
        Assert.Equal(testProduct.Quantity, result.Quantity);
        Assert.Equal(testProduct.Price, result.Price);
        await _innerRepositoryMock.Received(1).GetByIdAsync(uuid);
        var cacheProductJson = await _realRedisCache.GetStringAsync(cacheKey);
        var cacheProduct = JsonSerializer.Deserialize<Product?>(cacheProductJson!, _jsonOptions);
        Assert.NotNull(cacheProduct);
        Assert.Equal(uuid, cacheProduct.Uuid);
        Assert.Equal(testProduct.Name, cacheProduct.Name);
        Assert.Equal(testProduct.CategoryId, cacheProduct.CategoryId);
        Assert.Equal(testProduct.Quantity, cacheProduct.Quantity);
        Assert.Equal(testProduct.Price, cacheProduct.Price);
    }
    [Fact]
    public async Task GetByIdAsync_WhenUuidIsNotFound_ReturnNull()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        string cacheKey = $"product:{uuid}";
        _innerRepositoryMock.GetByIdAsync(uuid).Returns<Product?>((Product?)null);
        //Act
        var result = await _sut.GetByIdAsync(uuid);
        //Assert
        Assert.Null(result);
        await _innerRepositoryMock.Received(1).GetByIdAsync(uuid);
        var cacheProductJson = await _realRedisCache.GetStringAsync(cacheKey);
        Assert.Null(cacheProductJson);
    }
    [Fact]
    public async Task UpdateAsync_WhenProductIsExist_UpdatesDatabaseAndSavesToCache()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        string cacheKey = $"product:{uuid}";
        var testProduct = new Product(uuid, "Test", ProductCategory.GraphicsCards, 10.99m, 1);
        _innerRepositoryMock.UpdateAsync(uuid, testProduct).Returns<Product?>(testProduct);
        //Act
        var result = await _sut.UpdateAsync(uuid, testProduct);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(testProduct.Name, result.Name);
        Assert.Equal(testProduct.CategoryId, result.CategoryId);
        Assert.Equal(testProduct.Quantity, result.Quantity);
        Assert.Equal(testProduct.Price, result.Price);
        await _innerRepositoryMock.Received(1).UpdateAsync(uuid, testProduct);
        var cacheProductJson = await _realRedisCache.GetStringAsync(cacheKey);
        var cacheProduct = JsonSerializer.Deserialize<Product?>(cacheProductJson!, _jsonOptions);
        Assert.NotNull(cacheProduct);
        Assert.Equal(uuid, cacheProduct.Uuid);
        Assert.Equal(testProduct.Name, cacheProduct.Name);
        Assert.Equal(testProduct.CategoryId, cacheProduct.CategoryId);
        Assert.Equal(testProduct.Quantity, cacheProduct.Quantity);
        Assert.Equal(testProduct.Price, cacheProduct.Price);
    }
    [Fact]
    public async Task UpdateAsync_WhenProductIsNotExist_NotUpdatedInCache()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        string cacheKey = $"product:{uuid}";
        var testProduct = new Product(uuid, "Test", ProductCategory.GraphicsCards, 10.99m, 1);
        _innerRepositoryMock.UpdateAsync(uuid, testProduct).Returns<Product?>((Product?)null);
        //Act
        var result = await _sut.UpdateAsync(uuid, testProduct);
        //Assert
        Assert.Null(result);
        await _innerRepositoryMock.Received(1).UpdateAsync(uuid, testProduct);
        var cacheProductJson = await _realRedisCache.GetStringAsync(cacheKey);
        Assert.Null(cacheProductJson);
    }
    [Fact]
    public async Task DeleteAsync_WhenUuidIsValid_DeletedProduct()
    {
        var uuid = Guid.NewGuid();
        string cacheKey = $"product:{uuid}";
        var testProduct = new Product(uuid, "Test", ProductCategory.GraphicsCards, 10.99m, 1);
        await _realRedisCache.SetStringAsync(cacheKey, JsonSerializer.Serialize<Product>(testProduct, _jsonOptions));
        _innerRepositoryMock.DeleteAsync(uuid).Returns(true);
        //Act
        var result = await _sut.DeleteAsync(uuid);
        //Assert
        Assert.True(result);
        await _innerRepositoryMock.Received(1).DeleteAsync(uuid);
        var cacheResult = await _realRedisCache.GetStringAsync(cacheKey);
        Assert.Null(cacheResult);
    }
    /*
    public async Task<bool> DeleteAsync(Guid uuid)
    {
        var isDeleted = await _innerRepository.DeleteAsync(uuid);

        if (isDeleted)
        {
            await _cache.RemoveAsync($"product:{uuid}");
        }
        return isDeleted;
    }
    }*/
}