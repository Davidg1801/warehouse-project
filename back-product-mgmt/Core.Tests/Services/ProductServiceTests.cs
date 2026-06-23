using Core.Entities;
using Core.Interfaces;
using Core.Queries;
using Core.Services;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Core.Tests.Services;

public class ProductServiceTests
{
    private readonly IProductRepository _repositoryMock;
    private readonly ProductService _sut;
    public ProductServiceTests()
    {
        _repositoryMock = Substitute.For<IProductRepository>();
        _sut = new ProductService(_repositoryMock);
    }

    [Fact]
    public async Task AddProductAsync_WhenValidData_CreatedAndSavesProduct()
    {
        //Arrange
        var testedProduct = new
        {
            Name = "Laptop",
            CategoryId = ProductCategory.Others,
            Price = 99.99m,
            Quantity = 2
        };

        //Act
        var result = await _sut.AddProductAsync(testedProduct.Name, testedProduct.CategoryId, testedProduct.Price, testedProduct.Quantity);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(testedProduct.Name, result.Name);
        Assert.Equal(testedProduct.CategoryId, result.CategoryId);
        Assert.Equal(testedProduct.Price, result.Price);
        Assert.Equal(testedProduct.Quantity, result.Quantity);

        await _repositoryMock.Received(1).AddAsync(Arg.Is<Product>(p => p.Name == testedProduct.Name &&
            p.CategoryId == testedProduct.CategoryId &&
            p.Price == testedProduct.Price &&
            p.Quantity == testedProduct.Quantity
        ));
    }
    [Fact]
    public async Task GetAllProductAsync_WhenQueryIsValid_ReturnPagedResultFromRepository()
    {
        //Arrange
        var query = new ProductQuery(PageNumber: 1, PageSize: 10, Name: "GB", CategoryIds: [(int)ProductCategory.Others, (int)ProductCategory.HDD_Drivers], Descending: false, OrderBy: "Name");

        var fakeProducts = new List<Product>
        {
            Product.CreateProduct("RAM 16GB", ProductCategory.Others, 50m, 5),
            Product.CreateProduct("SSD Disk 500 GB", ProductCategory.HDD_Drivers, 300.99m, 10)
        };

        var expectedResult = new Core.Results.PagedResult<Product>(
            2,
            fakeProducts
        );
        _repositoryMock.GetPagedAsync(query).Returns(expectedResult);
        //Act
        var result = await _sut.GetAllProductsAsync(query);

        //Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Data.Count());
        Assert.Equal("RAM 16GB", result.Data.First().Name);
        Assert.Equal(ProductCategory.Others, result.Data.First().CategoryId);
        Assert.Equal(50m, result.Data.First().Price);
        Assert.Equal(5, result.Data.First().Quantity);
        Assert.Equal("SSD Disk 500 GB", result.Data.Last().Name);
        Assert.Equal(ProductCategory.HDD_Drivers, result.Data.Last().CategoryId);
        Assert.Equal(300.99m, result.Data.Last().Price);
        Assert.Equal(10, result.Data.Last().Quantity);
        await _repositoryMock.Received(1).GetPagedAsync(query);
    }

    [Fact]
    public async Task DeleteProductAsync_WhenProductsDeleted_ReturnTrue()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        _repositoryMock.DeleteAsync(uuid).Returns(true);

        //Act
        var result = await _sut.DeleteProductAsync(uuid);

        //Arrange
        Assert.True(result);
        await _repositoryMock.Received(1).DeleteAsync(uuid);
    }

    [Fact]
    public async Task DeleteProductAsync_WhenDatabasesLostConnection_ThrowException()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        _repositoryMock.DeleteAsync(uuid).ThrowsAsync(new Exception("Database lost connection"));

        //Act
        var exception = await Assert.ThrowsAsync<Exception>(async () =>
        {
            await _sut.DeleteProductAsync(uuid);
        });

        //Assert
        Assert.Equal("Database lost connection", exception.Message);
        await _repositoryMock.Received(1).DeleteAsync(uuid);
    }

    [Fact]
    public async Task UpdateProductAsync_WhenProductNotFound_ReturnNull()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        var data = new Product(uuid, "Test", ProductCategory.Headsets, 10.99m, 2);
        _repositoryMock.GetByIdAsync(uuid).Returns((Product?)null);
        //Act
        var result = await _sut.UpdateProductAsync(uuid, data.Name, data.CategoryId, data.Price, data.Quantity);

        //Assert
        Assert.Null(result);
        await _repositoryMock.Received(1).GetByIdAsync(uuid);
        await _repositoryMock.DidNotReceiveWithAnyArgs().UpdateAsync(Arg.Any<Guid>(), Arg.Any<Product>());
    }

    [Fact]
    public async Task UpdateProductAsync_WhenProductFound_ReturnProduct()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        var oldData = new Product(uuid, "Test", ProductCategory.Headsets, 10.99m, 2);
        string newName = "Nowy";
        int newQuantity = 3;
        _repositoryMock.GetByIdAsync(uuid).Returns(oldData);
        _repositoryMock.UpdateAsync(uuid, oldData).Returns(oldData);
        //Act
        var result = await _sut.UpdateProductAsync(uuid, newName, oldData.CategoryId, oldData.Price, newQuantity);

        //Assert
        Assert.NotNull(result);
        Assert.Equal(uuid, result.Uuid);
        Assert.Equal(newName, result.Name);
        Assert.Equal(oldData.CategoryId, result.CategoryId);
        Assert.Equal(oldData.Price, result.Price);
        Assert.Equal(newQuantity, result.Quantity);
        await _repositoryMock.Received(1).GetByIdAsync(uuid);
        await _repositoryMock.Received(1).UpdateAsync(uuid, oldData);
    }

    [Fact]
    public async Task UpdateProductAsync_WhenDatabaseLostConnection_ThrowException()
    {
        //Arrange
        var errMsg = "Database lost connection";
        var uuid = Guid.NewGuid();
        var oldData = new Product(uuid, "Test", ProductCategory.Headsets, 10.99m, 2);
        string newName = "Nowy";
        int newQuantity = 3;
        _repositoryMock.GetByIdAsync(uuid).ThrowsAsync(new Exception(errMsg));

        //Act
        var exception = await Assert.ThrowsAsync<Exception>(async () =>
        {
            await _sut.UpdateProductAsync(uuid, newName, oldData.CategoryId, oldData.Price, newQuantity);
        });

        //Assert
        Assert.Equal(errMsg, exception.Message);
        await _repositoryMock.Received(1).GetByIdAsync(uuid);
        await _repositoryMock.DidNotReceiveWithAnyArgs().UpdateAsync(Arg.Any<Guid>(), Arg.Any<Product>());
    }

    [Fact]
    public async Task UpdateProductAsync_WhenDatabaseUserHasNoPermission_ThrowException()
    {
        //Arrange
        var errMsg = "User has no permission";
        var uuid = Guid.NewGuid();
        var oldData = new Product(uuid, "Test", ProductCategory.Headsets, 10.99m, 2);
        string newName = "Nowy";
        int newQuantity = 3;
        _repositoryMock.GetByIdAsync(uuid).Returns(oldData);
        _repositoryMock.UpdateAsync(uuid, oldData).ThrowsAsync(new Exception(errMsg));
        //Act
        var exception = await Assert.ThrowsAsync<Exception>(async () =>
        {
            await _sut.UpdateProductAsync(uuid, newName, oldData.CategoryId, oldData.Price, newQuantity);
        });

        //Assert
        Assert.Equal(errMsg, exception.Message);
        await _repositoryMock.Received(1).GetByIdAsync(uuid);
        await _repositoryMock.Received(1).UpdateAsync(uuid, oldData);
    }

    [Fact]
    public async Task GetProductAsync_WhenProductExists_ReturnsProduct()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        var data = new Product(uuid, "Test", ProductCategory.Headsets, 10.99m, 2);
        _repositoryMock.GetByIdAsync(uuid).Returns(data);
        //Act
        var result = await _sut.GetProductAsync(uuid);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(uuid, result.Uuid);
        Assert.Equal(data.Name, result.Name);
        Assert.Equal(data.CategoryId, result.CategoryId);
        Assert.Equal(data.Price, result.Price);
        Assert.Equal(data.Quantity, result.Quantity);
        await _repositoryMock.Received(1).GetByIdAsync(uuid);
    }

    [Fact]
    public async Task GetProductAsync_WhenProductDoesNotExist_ReturnsNull()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        _repositoryMock.GetByIdAsync(uuid).Returns((Product?)null);
        //Act
        var result = await _sut.GetProductAsync(uuid);
        //Assert
        Assert.Null(result);
        await _repositoryMock.Received(1).GetByIdAsync(uuid);
    }
}