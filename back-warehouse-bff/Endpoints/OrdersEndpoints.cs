using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services.Interfaces;

namespace back_warehouse_bff.Endpoints;

public static class OrdersEndpoints
{
    public static void MapOrdersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orders");

        group.MapPost("/", async (OrderRequestDto request, IOrderService orderService, ClaimsPrincipal user) =>
        {
            var currentUserId = user.FindFirst("preferred_username")?.Value
                             ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = user.IsInRole("admin");
            if (!isAdmin)
            {
                request.CustomerId = currentUserId ?? string.Empty;
            }

            //Validation from Annotations
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(request);
            bool isValid = Validator.TryValidateObject(request, validationContext, validationResults, validateAllProperties: true);

            if (!isValid)
            {
                var errors = validationResults.Select(e => e.ErrorMessage ?? "Error.").ToList();
                return Results.BadRequest(ApiResponse<OrderResponseDto>.Fail(errors));
            }

            var response = await orderService.AddOrderAsync(request);

            if (response.Success)
            {
                return Results.Ok(response);
            }

            return Results.BadRequest(response);
        })
        .RequireAuthorization()
        .Produces<ApiResponse<OrderResponseDto>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<OrderResponseDto>>(StatusCodes.Status400BadRequest);

        group.MapGet("/{uuid:guid}", async (Guid uuid, IOrderService orderService, ClaimsPrincipal user) =>
        {
            var response = await orderService.GetOrderByIdAsync(uuid);

            var currentUserId = user.FindFirst("preferred_username")?.Value;
            var isAdmin = user.IsInRole("admin");

            if (!response.Success || response.Data == null)
            {
                return Results.NotFound(response);
            }

            if (!isAdmin && response.Data!.CustomerId != currentUserId)
            {
                return Results.Forbid();
            }

            return Results.Ok(response);
        })
        .RequireAuthorization()
        .Produces<ApiResponse<OrderResponseDto>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<OrderResponseDto>>(StatusCodes.Status404NotFound);

        group.MapGet("/", async ([AsParameters] OrderQueryDto query, IOrderService orderService, ClaimsPrincipal user) =>
        {
            var currentUserId = user.FindFirst("preferred_username")?.Value;
            var isAdmin = user.IsInRole("admin");
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(query);

            if (!isAdmin)
            {
                query.CustomerId = currentUserId;
            }
            bool isValid = Validator.TryValidateObject(query, validationContext, validationResults, validateAllProperties: true);

            if (!isValid)
            {
                var errors = validationResults.Select(e => e.ErrorMessage ?? "Invalid query parameters.").ToList();
                return Results.BadRequest(PagedResponse<IEnumerable<OrderResponseDto>>.FailPaged(string.Join(" | ", errors)));
            }

            var response = await orderService.GetAllOrdersAsync(query);

            if (response.Success)
            {
                return Results.Ok(response);
            }

            return Results.BadRequest(response);
        })
        .RequireAuthorization()
        .Produces<PagedResponse<IEnumerable<OrderResponseDto>>>(StatusCodes.Status200OK)
        .Produces<PagedResponse<IEnumerable<OrderResponseDto>>>(StatusCodes.Status400BadRequest);
    }
}