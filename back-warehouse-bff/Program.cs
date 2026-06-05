
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Services;
using back_warehouse_bff.Services.Interfaces;
using NATS.Client.Core;
using NATS.Net;
using back_warehouse_bff.Endpoints;
using System.Text.Json.Serialization;

namespace back_warehouse_bff;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var natsUrl = builder.Configuration.GetValue<string>("Nats:Url")
               ?? "nats://nats:4222";

        builder.Services.AddSingleton<INatsClient>(new NatsClient(natsUrl));
        builder.Services.AddScoped<IProductService, ProductNatsService>();

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();
        app.UseCors("CorsPolicy");
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.MapProductEndpoints();
        app.Run();

    }
}
