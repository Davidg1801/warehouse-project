using System.Text.Json;
using Core.Entities;
using Core.Interfaces;
using Core.Queries;
using Core.Results;
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

    public async Task<bool> DeleteAsync(Guid uuid)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            "DELETE FROM Products WHERE Uuid = @uuid", connection
        );
        command.Parameters.AddWithValue("uuid", uuid);

        int deletedRows = await command.ExecuteNonQueryAsync();
        return deletedRows > 0;
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

    public async Task<Product?> UpdateAsync(Guid uuid, Product data)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        string productJson = JsonSerializer.Serialize(data, _jsonOptions);

        await using var command = new NpgsqlCommand(
            "UPDATE Products SET Data = @data::jsonb WHERE Uuid = @uuid", connection
        );
        command.Parameters.AddWithValue("uuid", uuid);
        command.Parameters.AddWithValue("data", productJson);
        int updatedRows = await command.ExecuteNonQueryAsync();
        if (updatedRows > 0)
        {
            return data;
        }
        return null;
    }

    public async Task<PagedResult<Product>> GetPagedAsync(ProductQuery query)
    {

        var products = new List<Product>();
        var sqlCount = "SELECT count(*) from Products WHERE 1=1";
        var filters = "";
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand();

        //Name filters
        if (!string.IsNullOrEmpty(query.Name))
        {
            filters += " AND Data->>'Name' ILike @name";
            command.Parameters.AddWithValue("name", $"%{query.Name}%");
        }

        //ContainerId
        if (query.CategoryId.HasValue)
        {
            filters += " AND (Data->>'CategoryId')::int = @categoryId";
            command.Parameters.AddWithValue("categoryId", query.CategoryId);
        }

        //Get TotalCount
        command.CommandText = sqlCount + filters;
        command.Connection = connection;
        var totalCount = Convert.ToInt32(await command.ExecuteScalarAsync());

        if (totalCount == 0)
        {
            return new PagedResult<Product>(0, products);
        }

        //Sort
        var allowedSortColumns = new[] { "Name", "Price", "Quantity" };
        var sortColumn = allowedSortColumns.FirstOrDefault(c => c.Equals(query.OrderBy, StringComparison.OrdinalIgnoreCase)) ?? "Name";
        var direction = query.Descending ? "DESC" : "ASC";

        if (sortColumn.Equals("Price") || sortColumn.Equals("Quantity"))
        {
            filters += $" ORDER BY (Data->>'{sortColumn}')::numeric {direction}";
        }
        else
        {
            filters += $" ORDER BY Data->>'{sortColumn}' {direction}";
        }

        //Pagination
        filters += $" LIMIT @PageSize OFFSET @offset";
        command.Parameters.AddWithValue("PageSize", query.PageSize);
        command.Parameters.AddWithValue("offset", (query.PageNumber - 1) * query.PageSize);
        command.CommandText = $"SELECT Data FROM Products WHERE 1=1 {filters}";

        await using var read = await command.ExecuteReaderAsync();
        while (await read.ReadAsync())
        {
            var product = JsonSerializer.Deserialize<Product>(read.GetString(0), _jsonOptions);
            if (product != null)
                products.Add(product);
        }
        return new PagedResult<Product>(totalCount, products);
    }
}