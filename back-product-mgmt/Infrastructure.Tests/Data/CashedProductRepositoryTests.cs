using System.Text.Json;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
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
}