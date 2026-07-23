using System.ComponentModel.DataAnnotations;
using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services.Interfaces;

public static class OrdersEndpoints
{
    public static void MapOrdersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("bff/orders");

        group.MapPost("/", async (OrderRequestDto request, IOrderService orderService) =>
        {
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
    }
}