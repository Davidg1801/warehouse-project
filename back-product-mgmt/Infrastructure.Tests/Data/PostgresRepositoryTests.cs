
using System.Text.Json;
using Core.Entities;
using Core.Queries;
using Infrastructure.Data;
using Npgsql;
using Testcontainers.PostgreSql;
namespace Infrastructure.Tests.Data;

public class PostgresRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer;
    private PostgresRepository _sut = null!;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };
    public PostgresRepositoryTests()
    {
        _dbContainer = new PostgreSqlBuilder("postgres:16-alpine").WithDatabase("TestWaremHouse").WithUsername("postgres").WithPassword("Test1w2!S").Build();
    }
    public async Task DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();

        string connectionString = _dbContainer.GetConnectionString();
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            "CREATE TABLE Products (Uuid UUID PRIMARY KEY, Data JSONB NOT NULL);",
            connection);
        await command.ExecuteNonQueryAsync();
        _sut = new PostgresRepository(connectionString);
    }

    [Fact]
    public async Task AddAsync_WhenProductIsValid_SaveToDatabase()
    {
        //Arrange
        var product = Product.CreateProduct("Test", ProductCategory.Processors, 99.99m, 2);
        //Act
        await _sut.AddAsync(product);
        //Assert
        await using var connection = new NpgsqlConnection(_dbContainer.GetConnectionString());
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            "SELECT Data FROM Products WHERE Uuid = @uuid", connection);
        command.Parameters.AddWithValue("uuid", product.Uuid);
        await using var reader = await command.ExecuteReaderAsync();
        Assert.True(await reader.ReadAsync(), "Product is not save in DB!");
        string productStringJson = reader.GetString(0);
        var productFromDb = JsonSerializer.Deserialize<Product>(productStringJson, _jsonOptions);
        Assert.Equal(product.Uuid, productFromDb!.Uuid);
        Assert.Equal(product.Name, productFromDb.Name);
        Assert.Equal(product.CategoryId, productFromDb.CategoryId);
        Assert.Equal(product.Price, productFromDb.Price);
        Assert.Equal(product.Quantity, productFromDb.Quantity);
    }
    [Fact]
    public async Task DeleteAsync_WhenUuidExist_DeleteRecordFromDb()
    {
        //Arrange
        var product = Product.CreateProduct("Test", ProductCategory.Processors, 99.99m, 2);
        await _sut.AddAsync(product);
        //Act
        var result = await _sut.DeleteAsync(product.Uuid);
        //Assert
        Assert.True(result);
        await using var connection = new NpgsqlConnection(_dbContainer.GetConnectionString());
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "SELECT count(*) FROM Products WHERE Uuid = @uuid", connection);
        command.Parameters.AddWithValue("uuid", product.Uuid);
        var count = Convert.ToInt32(await command.ExecuteScalarAsync());
        Assert.Equal(0, count);
    }

    [Fact]
    public async Task GetAllAsync_WhenDatabaseIsEmpty_ReturnsEmptyList()
    {
        //Act
        var result = await _sut.GetAllAsync();
        //Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllAsync_WhenProductsExist_ReturnsAllProducts()
    {
        //Arrange
        var prod1 = Product.CreateProduct("test", ProductCategory.Processors, 10.99m, 1);
        var prod2 = Product.CreateProduct("test2", ProductCategory.Processors, 10.99m, 2);
        await _sut.AddAsync(prod1);
        await _sut.AddAsync(prod2);
        //Act
        var result = await _sut.GetAllAsync();
        //Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
        var dbProd1 = result.Single(p => p.Uuid == prod1.Uuid);
        var dbProd2 = result.Single(p => p.Uuid == prod2.Uuid);
        Assert.Equal(prod1.Name, dbProd1.Name);
        Assert.Equal(prod1.CategoryId, dbProd1.CategoryId);
        Assert.Equal(prod1.Quantity, dbProd1.Quantity);
        Assert.Equal(prod1.Price, dbProd1.Price);
        Assert.Equal(prod2.Name, dbProd2.Name);
        Assert.Equal(prod2.CategoryId, dbProd2.CategoryId);
        Assert.Equal(prod2.Quantity, dbProd2.Quantity);
        Assert.Equal(prod2.Price, dbProd2.Price);
    }
    [Fact]
    public async Task GetByIdAsync_WhenUuidIsValid_ReturnProduct()
    {
        //Arrange
        var prod = Product.CreateProduct("test", ProductCategory.Processors, 10.99m, 1);
        await _sut.AddAsync(prod);
        //Act
        var result = await _sut.GetByIdAsync(prod.Uuid);
        //
        Assert.NotNull(result);
        Assert.Equal(prod.Uuid, result.Uuid);
        Assert.Equal(prod.Name, result.Name);
        Assert.Equal(prod.CategoryId, result.CategoryId);
        Assert.Equal(prod.Price, result.Price);
        Assert.Equal(prod.Quantity, result.Quantity);
    }
    [Fact]
    public async Task GetByIdAsync_WhenUuidIsInvalid_ReturnNull()
    {
        //Arrange
        var uuid = Guid.NewGuid();
        //Act
        var result = await _sut.GetByIdAsync(uuid);
        //
        Assert.Null(result);
    }
    [Fact]
    public async Task UptadeAsync_WhenUuidIsValid_ReturnProduct()
    {
        //Arrange
        var prod = Product.CreateProduct("test", ProductCategory.Processors, 10.99m, 1);
        await _sut.AddAsync(prod);
        var updatedProd = new Product(prod.Uuid, prod.Name, prod.CategoryId, prod.Price, 3);
        //Act
        var result = await _sut.UpdateAsync(prod.Uuid, updatedProd);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(updatedProd.Uuid, result.Uuid);
        Assert.Equal(updatedProd.Quantity, result.Quantity);
        Assert.Equal(updatedProd.Price, result.Price);
        Assert.Equal(updatedProd.CategoryId, result.CategoryId);
        Assert.Equal(updatedProd.Name, result.Name);
        await using var connection = new NpgsqlConnection(_dbContainer.GetConnectionString());
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "SELECT Data FROM Products WHERE Uuid = @uuid", connection);
        command.Parameters.AddWithValue("uuid", prod.Uuid);
        var dbStringProductJson = (string?)await command.ExecuteScalarAsync();
        var dbProduct = JsonSerializer.Deserialize<Product>(dbStringProductJson!, _jsonOptions);
        Assert.Equal(updatedProd.Uuid, dbProduct!.Uuid);
        Assert.Equal(updatedProd.Quantity, dbProduct.Quantity);
        Assert.Equal(updatedProd.Price, dbProduct.Price);
        Assert.Equal(updatedProd.CategoryId, dbProduct.CategoryId);
        Assert.Equal(updatedProd.Name, dbProduct.Name);
    }
    [Fact]
    public async Task GetPagedAsync_WhenFiltersAreValid_ReturnsFilteredProducts()
    {
        //Arrange
        var prod1 = Product.CreateProduct("test", ProductCategory.Processors, 10.99m, 1);
        var prod2 = Product.CreateProduct("test2", ProductCategory.Processors, 10.99m, 2);
        await _sut.AddAsync(prod1);
        await _sut.AddAsync(prod2);
        var query = new ProductQuery(1, 10, "tes", [(int)ProductCategory.Processors], false, null);
        //Act
        var result = await _sut.GetPagedAsync(query);
        //Assert
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Data.Count());
        Assert.Equal(prod1.Uuid, result.Data.First().Uuid);
        Assert.Equal(prod2.Uuid, result.Data.Last().Uuid);
    }
    [Fact]
    public async Task GetPagedAsync_WhenFiltersNoProductsMatch_ReturnsEmptyResult()
    {
        //Arrange
        var prod1 = Product.CreateProduct("test", ProductCategory.Processors, 10.99m, 1);
        var prod2 = Product.CreateProduct("test2", ProductCategory.Processors, 10.99m, 2);
        await _sut.AddAsync(prod1);
        await _sut.AddAsync(prod2);
        var query = new ProductQuery(1, 10, "d", [(int)ProductCategory.Processors], false, null);
        //Act
        var result = await _sut.GetPagedAsync(query);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.TotalCount);
        Assert.Empty(result.Data);
    }
    [Fact]
    public async Task GetPagedAsync_WhenPageSizeIsSmalletThanTotal_ReturnsCorrectPage()
    {
        //Arrange
        var prod1 = Product.CreateProduct("test", ProductCategory.Processors, 10.99m, 1);
        var prod2 = Product.CreateProduct("test2", ProductCategory.Processors, 10.99m, 2);
        var prod3 = Product.CreateProduct("test3", ProductCategory.Processors, 10.99m, 2);
        await _sut.AddAsync(prod1);
        await _sut.AddAsync(prod2);
        await _sut.AddAsync(prod3);
        var query = new ProductQuery(2, 2, null, null, false, null);
        //Act
        var result = await _sut.GetPagedAsync(query);
        //Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.TotalCount);
        Assert.NotNull(result.Data);
        Assert.Single(result.Data);
    }
    [Fact]
    public async Task GetPagedAsync_WhenFiltersAreNullOrEmptu_ReturnsAllProducts()
    {
        //Arrange
        var prod1 = Product.CreateProduct("test", ProductCategory.Processors, 10.99m, 1);
        var prod2 = Product.CreateProduct("test2", ProductCategory.Processors, 10.99m, 2);
        await _sut.AddAsync(prod1);
        await _sut.AddAsync(prod2);
        var query = new ProductQuery(1, 10, null, [], false, null);
        //Act
        var result = await _sut.GetPagedAsync(query);
        //Assert
        Assert.Equal(2, result.TotalCount);
        Assert.Equal(2, result.Data.Count());
    }
    [Fact]
    public async Task GetPagedAsync_WhenSortedByPriceDesceding_ReturnsProperlySortedProducts()
    {
        //Arrange
        var cheapest = Product.CreateProduct("the cheapest", ProductCategory.Processors, 1.99m, 1);
        var cheap = Product.CreateProduct("cheap", ProductCategory.Processors, 10.99m, 2);
        var expensive = Product.CreateProduct("expensive", ProductCategory.RAM_Memory, 3000.99m, 4);
        await _sut.AddAsync(cheapest);
        await _sut.AddAsync(cheap);
        await _sut.AddAsync(expensive);
        var query = new ProductQuery(1, 10, null, [], true, "Price");
        //Act
        var result = await _sut.GetPagedAsync(query);
        //Assert
        var products = result.Data.ToList();
        Assert.Equal(3, result.TotalCount);
        Assert.Equal(expensive.Uuid, products[0].Uuid);
        Assert.Equal(cheap.Uuid, products[1].Uuid);
        Assert.Equal(cheapest.Uuid, products[2].Uuid);
    }

    [Fact]
    public async Task UpdateManyAsync_WhenProductsExists_UptadesAllProducts()
    {
        //Arrange
        var prod1 = Product.CreateProduct("test", ProductCategory.Processors, 10.99m, 1);
        var prod2 = Product.CreateProduct("test2", ProductCategory.Processors, 10.99m, 2);
        await _sut.AddAsync(prod1);
        await _sut.AddAsync(prod2);
        var updatedProd1 = new Product(prod1.Uuid, prod1.Name, prod1.CategoryId, prod1.Price, (prod1.Quantity - 1));
        var updatedProd2 = new Product(prod2.Uuid, prod2.Name, prod2.CategoryId, prod2.Price, (prod2.Quantity - 1));
        //Act
        await _sut.UpdateManyAsync(new[] { updatedProd1, updatedProd2 });
        //Assert
        var result1 = await _sut.GetByIdAsync(prod1.Uuid);
        var result2 = await _sut.GetByIdAsync(prod2.Uuid);
        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal(prod1.Name, result1.Name);
        Assert.Equal(prod2.Name, result2.Name);
        Assert.Equal(updatedProd1.Quantity, result1.Quantity);
        Assert.Equal(updatedProd2.Quantity, result2.Quantity);
    }

    [Fact]
    public async Task UpdateManyAsync_WhenListIstEmpty_NotThrowException()
    {
        //Arrange
        var emptyList = new List<Product>();
        //Act
        var exception = await Record.ExceptionAsync(() => _sut.UpdateManyAsync(emptyList));
        //Assert
        Assert.Null(exception);
    }

    [Fact]
    public async Task UpdateManyAsync_WhenProductDoesNotExist_IgnoresAndDoesNotThrow()
    {
        // Arrange
        var fakeProduct = Product.CreateProduct("test", ProductCategory.Processors, 10m, 1);
        // Act
        var exception = await Record.ExceptionAsync(() => _sut.UpdateManyAsync(new[] { fakeProduct }));
        // Assert
        Assert.Null(exception);
        var result = await _sut.GetByIdAsync(fakeProduct.Uuid);
        Assert.Null(result);
    }
}