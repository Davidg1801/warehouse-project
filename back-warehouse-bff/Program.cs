using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Services;
using back_warehouse_bff.Services.Interfaces;
using NATS.Client.Core;
using NATS.Net;
using back_warehouse_bff.Endpoints;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authorization;
using Swashbuckle.AspNetCore.SwaggerGen;

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
        builder.Services.AddSwaggerGen(options =>
        {
            options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.OAuth2,
                Flows = new OpenApiOAuthFlows
                {
                    AuthorizationCode = new OpenApiOAuthFlow
                    {
                        AuthorizationUrl = new Uri("http://localhost:8080/realms/warehouse-realm/protocol/openid-connect/auth"),
                        TokenUrl = new Uri("http://localhost:8080/realms/warehouse-realm/protocol/openid-connect/token"),
                        Scopes = new Dictionary<string, string>
                        {
                            { "openid", "OpenID Connect" }
                        }
                    }
                }
            });

            options.OperationFilter<SecurityRequirementsOperationFilter>();
        });
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AngularApp", policy =>
            {
                policy.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod();
            });
        });

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = "http://keycloak:8080/realms/warehouse-realm";
            //https off
            options.RequireHttpsMetadata = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                //For angular
                ValidIssuer = "http://localhost:8080/realms/warehouse-realm",
                ValidateAudience = false, // on PROD should be true
                ValidateLifetime = true
            };
        });
        builder.Services.AddAuthorization();
        var app = builder.Build();
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                options.OAuthClientId("angular-frontend");
                options.OAuthUsePkce();
            });
        }

        app.UseCors("AngularApp"); //1
        app.UseAuthentication(); //2
        app.UseAuthorization(); //3
        app.MapProductEndpoints(); //4
        app.Run();

    }
}

public class SecurityRequirementsOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasAuthorize = context.ApiDescription.ActionDescriptor.EndpointMetadata
            .OfType<IAuthorizeData>().Any();

        if (hasAuthorize)
        {
            operation.Security = new List<OpenApiSecurityRequirement>
            {
                new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "oauth2"
                            }
                        },
                        new[] { "openid" }
                    }
                }
            };
            if (!operation.Responses.ContainsKey("401"))
            {
                operation.Responses.Add("401", new OpenApiResponse { Description = "Unauthorized - Valid JWT token is missing or expired." });
            }

            if (!operation.Responses.ContainsKey("403"))
            {
                operation.Responses.Add("403", new OpenApiResponse { Description = "Forbidden - Valid JWT token is present, but lacks required roles or permissions." });
            }
        }
    }
}