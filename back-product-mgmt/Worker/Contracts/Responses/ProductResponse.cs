using Core.Entities;
namespace Worker.Contracts.Response;

public record ProductResponse(
    Guid Uuid,
    string Name,
    ProductCategory CategoryId,
    decimal Price,
    int Quantity
);