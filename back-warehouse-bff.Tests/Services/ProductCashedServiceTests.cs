using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services;
using back_warehouse_bff.Services.Interfaces;
using NSubstitute;

namespace back_warehouse_bff.Tests.Services;

public class ProductCashedServiceTests
{
    private readonly IProductService _innerServiceMock;
    private readonly IProductTopCacheService _cacheServiceMock;
    private readonly IProductNotificationService _notificationServiceMock;
    private readonly ProductCashedService _sut;

    public ProductCashedServiceTests()
    {
        _innerServiceMock = Substitute.For<IProductService>();
        _cacheServiceMock = Substitute.For<IProductTopCacheService>();
        _notificationServiceMock = Substitute.For<IProductNotificationService>();
        _sut = new ProductCashedService(_innerServiceMock, _cacheServiceMock, _notificationServiceMock);
    }

    [Fact]
    public async Task AddProductAsync_DelegatesToInnerService()
    {
        // Arrange
        var request = new ProductRequestDto { Name = "Test" };
        var expectedResponse = ApiResponse<ProductResponseDto>.Ok(new ProductResponseDto { Name = "Test" });
        _innerServiceMock.AddProductAsync(request).Returns(expectedResponse);
        // Act
        var result = await _sut.AddProductAsync(request);
        // Assert
        Assert.Equal(expectedResponse, result);
        await _innerServiceMock.Received(1).AddProductAsync(request);
    }

    [Fact]
    public async Task DeleteProductAsync_DelegatesToInnerService()
    {
        // Arrange
        var uuid = Guid.NewGuid();
        var expectedResponse = ApiResponse<bool>.Ok(true);
        _innerServiceMock.DeleteProductAsync(uuid).Returns(expectedResponse);

        // Act
        var result = await _sut.DeleteProductAsync(uuid);

        // Assert
        Assert.Equal(expectedResponse, result);
        await _innerServiceMock.Received(1).DeleteProductAsync(uuid);
    }

    [Fact]
    public async Task GetAllProductsAsync_DelegatesToInnerService()
    {
        // Arrange
        var query = new ProductQueryDto { PageNumber = 2, PageSize = 20 };

        var expectedResponse = PagedResponse<IEnumerable<ProductResponseDto>>.OkPaged(
            data: new List<ProductResponseDto>(),
            totalCount: 0,
            pageNumber: 2,
            pageSize: 20
        );

        _innerServiceMock.GetAllProductsAsync(query).Returns(expectedResponse);

        // Act
        var result = await _sut.GetAllProductsAsync(query);

        // Assert
        Assert.Equal(expectedResponse, result);
        await _innerServiceMock.Received(1).GetAllProductsAsync(query);
    }

    [Fact]
    public async Task UpdateProductAsync_DelegatesToInnerService()
    {
        // Arrange
        var uuid = Guid.NewGuid();
        var request = new ProductRequestDto { Name = "Ram", Price = 99.99m };
        var expectedResponse = ApiResponse<ProductResponseDto>.Ok(new ProductResponseDto { Uuid = uuid, Name = "Ram" });
        _innerServiceMock.UpdateProductAsync(uuid, request).Returns(expectedResponse);
        // Act
        var result = await _sut.UpdateProductAsync(uuid, request);
        // Assert
        Assert.Equal(expectedResponse, result);
        await _innerServiceMock.Received(1).UpdateProductAsync(uuid, request);
    }

    [Fact]
    public async Task GetProductByIdAsync_Always_IncreasesVisitCountAndCallsInnerService()
    {
        // Arrange
        var uuid = Guid.NewGuid();
        var expectedResponse = ApiResponse<ProductResponseDto>.Fail("Error");

        _innerServiceMock.GetProductByIdAsync(uuid).Returns(expectedResponse);

        // Act
        var result = await _sut.GetProductByIdAsync(uuid);

        // Assert
        Assert.Equal(expectedResponse, result);
        await _cacheServiceMock.Received(1).IncreaseProductVisitAsync(uuid);
        await _innerServiceMock.Received(1).GetProductByIdAsync(uuid);
        await _cacheServiceMock.DidNotReceiveWithAnyArgs().IsProductInTopAsync(default);
    }

    [Fact]
    public async Task GetProductByIdAsync_WhenProductFoundButNotInTop_ReturnsProductWithoutCacheUpdate()
    {
        // Arrange
        var uuid = Guid.NewGuid();
        var productDto = new ProductResponseDto { Uuid = uuid, Name = "Mouse" };
        var innerResponse = ApiResponse<ProductResponseDto>.Ok(productDto);

        _innerServiceMock.GetProductByIdAsync(uuid).Returns(innerResponse);
        _cacheServiceMock.IsProductInTopAsync(uuid).Returns(false);

        // Act
        var result = await _sut.GetProductByIdAsync(uuid);

        // Assert
        Assert.True(result.Success);
        await _cacheServiceMock.Received(1).IncreaseProductVisitAsync(uuid);
        await _cacheServiceMock.Received(1).IsProductInTopAsync(uuid);
        await _cacheServiceMock.DidNotReceiveWithAnyArgs().UpdateProductDataAsync(default!);
        await _notificationServiceMock.DidNotReceiveWithAnyArgs().NotifyTopProductsUpdatedAsync();
    }

    [Fact]
    public async Task GetProductByIdAsync_WhenProductFoundAndIsInTop_UpdatesCacheAndNotifies()
    {
        // Arrange
        var uuid = Guid.NewGuid();
        var productDto = new ProductResponseDto { Uuid = uuid, Name = "Mouse" };
        var innerResponse = ApiResponse<ProductResponseDto>.Ok(productDto);
        _innerServiceMock.GetProductByIdAsync(uuid).Returns(innerResponse);
        _cacheServiceMock.IsProductInTopAsync(uuid).Returns(true);
        // Act
        var result = await _sut.GetProductByIdAsync(uuid);
        // Assert
        Assert.True(result.Success);

        await _cacheServiceMock.Received(1).IncreaseProductVisitAsync(uuid);
        await _cacheServiceMock.Received(1).IsProductInTopAsync(uuid);
        await _cacheServiceMock.Received(1).UpdateProductDataAsync(productDto);
        await _notificationServiceMock.Received(1).NotifyTopProductsUpdatedAsync();
    }
}