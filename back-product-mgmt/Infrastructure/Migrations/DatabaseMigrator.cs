using Npgsql;

namespace Infrastructure.Migrations;

public class DatabaseMigrator
{
    private readonly string _connectionString;

    public DatabaseMigrator(string connectionString)
    {
        _connectionString = connectionString;
    }

    public void MigrateUp()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        string script = @"CREATE TABLE IF NOT EXISTS Products(Uuid UUID PRIMARY KEY, Data JSONB NOT NULL);";

        using var command = new NpgsqlCommand(script, connection);
        command.ExecuteNonQuery();

        Console.WriteLine("Table product added to database schema successfully.");
    }

    public void MigrateDown()
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        string script = @"DROP TABLE Products;";

        using var command = new NpgsqlCommand(script, connection);
        command.ExecuteNonQuery();

        Console.WriteLine("Table Products dropped to database schema successfully.");
    }

}