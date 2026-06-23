using System;
using Core.Interfaces;
using Core.Services;
using Infrastructure.Data;
using Infrastructure.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NATS.Net;
using NATS.Client.Core;
using Microsoft.Extensions.Caching.Distributed;

namespace Worker
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = Host.CreateApplicationBuilder(args);

            var dbConnectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? "Host=postgres;Port=5432;Database=warehouse;Username=admin;Password=admin";

            var natsUrl = builder.Configuration.GetValue<string>("Nats:Url")
                ?? "nats://nats:4222";

            var redisConfiguration = builder.Configuration.GetValue<string>("Redis:Configuration")
                ?? "redis:6379";

            builder.Services.AddSingleton(new DatabaseMigrator(dbConnectionString));
            builder.Services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConfiguration;
            });
            builder.Services.AddSingleton<PostgresRepository>(new PostgresRepository(dbConnectionString));
            builder.Services.AddSingleton<IProductRepository>(provider =>
            {
                var postgresRepo = provider.GetRequiredService<PostgresRepository>();
                var cache = provider.GetRequiredService<IDistributedCache>();
                return new CashedProductRepository(postgresRepo, cache);
            });
            builder.Services.AddSingleton<IProductService, ProductService>();
            builder.Services.AddSingleton<INatsClient>(new NatsClient(natsUrl));

            builder.Services.AddHostedService<ProductNatsWorker>();

            var host = builder.Build();

            using (var scope = host.Services.CreateScope())
            {
                var migrator = scope.ServiceProvider.GetRequiredService<DatabaseMigrator>();
                Console.WriteLine("Start migration DB...");
                migrator.MigrateUp();
            }

            Console.WriteLine("Run NATS ...");
            host.Run();
        }
    }
}