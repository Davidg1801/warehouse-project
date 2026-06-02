using System.Text.Json;
using Core.Entities;
using Core.Interfaces;
using Npgsql;

namespace Infrastructure.Data;

public class PostgresRepository : IProductRepository
{
    private readonly string _connectionString;

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };
    public PostgresRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task AddAsync(Product product)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        string productJson = JsonSerializer.Serialize(product, _jsonOptions);

        await using var command = new NpgsqlCommand(
            "INSERT INTO Products (Uuid, Data) VALUES (@uuid, @data::jsonb)", connection
        );
        command.Parameters.AddWithValue("uuid", product.Uuid);
        command.Parameters.AddWithValue("data", productJson);
        await command.ExecuteNonQueryAsync();
    }

    public async Task DeleteAsync(Guid uuid)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            "DELETE FROM Products WHERE Uuid = @uuid", connection
        );
        command.Parameters.AddWithValue("uuid", uuid);
        await command.ExecuteNonQueryAsync();
    }

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        var products = new List<Product>();
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            "SELECT Data FROM Products", connection
        );
        await using var read = await command.ExecuteReaderAsync();
        while (await read.ReadAsync())
        {
            var product = JsonSerializer.Deserialize<Product>(read.GetString(0), _jsonOptions);
            if (product != null)
                products.Add(product);
        }
        return products;
    }

    public async Task<Product?> GetByIdAsync(Guid uuid)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            "SELECT Data FROM Products where Uuid = @uuid", connection
        );
        command.Parameters.AddWithValue("uuid", uuid);
        await using var read = await command.ExecuteReaderAsync();
        if (await read.ReadAsync())
        {
            var product = JsonSerializer.Deserialize<Product>(read.GetString(0), _jsonOptions);
            return product;
        }
        return null;
    }
}