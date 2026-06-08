using System.ComponentModel.DataAnnotations;
using back_warehouse_bff.Contracts.Common;
using back_warehouse_bff.Contracts.Requests;
using back_warehouse_bff.Contracts.Responses;
using back_warehouse_bff.Services.Interfaces;

namespace back_warehouse_bff.Endpoints;

public static class ProductEndpoints
{
    public static void MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("bff/products");

        group.MapPost("/", async (ProductRequestDto request, IProductService productService) =>
        {
            //Validation from Annotations
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(request);
            bool isValid = Validator.TryValidateObject(request, validationContext, validationResults, validateAllProperties: true);

            if (!isValid)
            {
                var errors = validationResults.Select(e => e.ErrorMessage ?? "Error.").ToList();
                return Results.BadRequest(ApiResponse<ProductResponseDto>.Fail(errors));
            }

            var response = await productService.AddProductAsync(request);

            if (response.Success)
            {
                return Results.Ok(response);
            }

            return Results.BadRequest(response);
        })
        .Produces<ApiResponse<ProductResponseDto>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<ProductResponseDto>>(StatusCodes.Status400BadRequest);

        group.MapDelete("/{uuid:guid}", async (Guid uuid, IProductService productService) =>
        {
            var response = await productService.DeleteProductAsync(uuid);

            if (response.Success)
            {
                return Results.Ok(response);
            }

            return Results.NotFound(response);
        })
        .Produces<ApiResponse<bool>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<bool>>(StatusCodes.Status404NotFound)
        .RequireAuthorization();

        group.MapPut("/{uuid:guid}", async (Guid uuid, ProductRequestDto request, IProductService productService) =>
        {
            var validationResults = new List<ValidationResult>();
            var validationContext = new ValidationContext(request);
            bool isValid = Validator.TryValidateObject(request, validationContext, validationResults, validateAllProperties: true);

            if (!isValid)
            {
                var errors = validationResults.Select(e => e.ErrorMessage ?? "Error.").ToList();
                return Results.BadRequest(ApiResponse<ProductResponseDto>.Fail(errors));
            }

            var response = await productService.UpdateProductAsync(uuid, request);

            if (response.Success)
            {
                return Results.Ok(response);
            }

            if (response.Errors != null && response.Errors.Any(e => e.Contains("not found", StringComparison.OrdinalIgnoreCase)))
            {
                return Results.NotFound(response);
            }

            return Results.BadRequest(response);
        })
        .RequireAuthorization()
        .Produces<ApiResponse<ProductResponseDto>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<ProductResponseDto>>(StatusCodes.Status400BadRequest)
        .Produces<ApiResponse<ProductResponseDto>>(StatusCodes.Status404NotFound);

        group.MapGet("/", async ([AsParameters] ProductQueryDto query, IProductService productService) =>
        {
            var response = await productService.GetAllProductsAsync(query);

            if (response.Success)
            {
                return Results.Ok(response);
            }

            return Results.BadRequest(response);
        })
        .Produces<ApiResponse<List<ProductResponseDto>>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<List<ProductResponseDto>>>(StatusCodes.Status400BadRequest);

        group.MapGet("/{uuid:guid}", async (Guid uuid, IProductService productService) =>
        {
            var response = await productService.GetProductByIdAsync(uuid);

            if (response.Success)
            {
                return Results.Ok(response);
            }

            if (response.Errors != null && response.Errors.Any(e => e.Contains("not found", StringComparison.OrdinalIgnoreCase)))
            {
                return Results.NotFound(response);
            }

            return Results.BadRequest(response);
        })
        .Produces<ApiResponse<ProductResponseDto>>(StatusCodes.Status200OK)
        .Produces<ApiResponse<ProductResponseDto>>(StatusCodes.Status404NotFound)
        .Produces<ApiResponse<ProductResponseDto>>(StatusCodes.Status400BadRequest);
    }
}