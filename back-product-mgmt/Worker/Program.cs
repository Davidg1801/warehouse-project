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

            builder.Services.AddSingleton(new DatabaseMigrator(dbConnectionString));
            builder.Services.AddSingleton<IProductRepository>(new PostgresRepository(dbConnectionString));
            builder.Services.AddSingleton<ProductService>();

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