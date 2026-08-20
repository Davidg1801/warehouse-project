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
using StackExchange.Redis;
using back_warehouse_bff.Services.Cache;
using System.Text.Json;
using System.Security.Claims;

namespace back_warehouse_bff;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var natsUrl = builder.Configuration.GetValue<string>("Nats:Url")
               ?? "nats://nats:4222";

        var valkeyConfig = builder.Configuration.GetValue<string>("Valkey:Configuration") ?? "valkey:6380";
        builder.Services.AddSingleton<INatsClient>(new NatsClient(natsUrl));
        builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(valkeyConfig));
        builder.Services.AddSignalR();
        builder.Services.AddScoped<ProductNatsService>();
        builder.Services.AddHostedService<ProductNatsListenerService>();
        builder.Services.AddScoped<IProductNotificationService, ProductNotificationService>();
        builder.Services.AddSingleton<IProductTopCacheService, TopProductValkeyCacheService>();
        builder.Services.AddScoped<IProductService>(provider =>
        {
            var natsService = provider.GetRequiredService<ProductNatsService>();
            var cacheService = provider.GetRequiredService<IProductTopCacheService>();
            var notificationService = provider.GetRequiredService<IProductNotificationService>();
            return new ProductCashedService(natsService, cacheService, notificationService);
        });
        builder.Services.AddScoped<IOrderService, OrderNatsService>();
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
                        AuthorizationUrl = new Uri("http://localhost/auth/realms/warehouse-realm/protocol/openid-connect/auth"),
                        TokenUrl = new Uri("http://localhost/auth/realms/warehouse-realm/protocol/openid-connect/token"),
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
                policy.WithOrigins("http://localhost", "http://localhost:4200").AllowAnyHeader().AllowAnyMethod();
            });
        });

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = "http://keycloak:8080/auth/realms/warehouse-realm";
            //https off
            options.RequireHttpsMetadata = false;

            options.Backchannel = new HttpClient(new KeycloakDockerHandler { InnerHandler = new HttpClientHandler() })
            {
                Timeout = TimeSpan.FromSeconds(30)
            };
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                //For angular
                ValidIssuer = "http://localhost/auth/realms/warehouse-realm",
                ValidateAudience = false, // on PROD should be true
                ValidateLifetime = true
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrWhiteSpace(accessToken) && path.StartsWithSegments("/websocket"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                },
                OnTokenValidated = context =>
                {
                    if (context.Principal?.Identity is ClaimsIdentity identity)
                    {
                        var resourceAccessClaim = identity.FindFirst("resource_access")?.Value;
                        if (!string.IsNullOrWhiteSpace(resourceAccessClaim))
                        {
                            using var json = JsonDocument.Parse(resourceAccessClaim);
                            if (json.RootElement.TryGetProperty("angular-frontend", out var clientElement) &&
                                clientElement.TryGetProperty("roles", out var rolesElement))
                            {
                                foreach (var role in rolesElement.EnumerateArray())
                                {
                                    identity.AddClaim(new Claim(ClaimTypes.Role, role.GetString()!));
                                }
                            }
                        }
                    }
                    return Task.CompletedTask;
                }

            };
        });
        builder.Services.AddAuthorization();
        var app = builder.Build();
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger(c =>
            {
                c.PreSerializeFilters.Add((swagger, httpReq) =>
                {
                    swagger.Servers = new List<OpenApiServer> { new OpenApiServer { Url = "http://localhost/bff" } };
                });
            });
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
        app.MapWebSocketEndpoints(); //5
        app.MapOrdersEndpoints(); //6
        app.Run();

    }
}
public class KeycloakDockerHandler : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.RequestUri != null && request.RequestUri.Host == "localhost")
        {
            var uriBuilder = new UriBuilder(request.RequestUri)
            {
                Host = "keycloak",
                Port = 8080
            };
            request.RequestUri = uriBuilder.Uri;
        }
        return base.SendAsync(request, cancellationToken);
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