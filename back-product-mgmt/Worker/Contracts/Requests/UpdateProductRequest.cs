using Core.Entities;

namespace Worker.Contracts.Request;

public record UpdateProductRequest(
    Guid Uuid,
    string Name,
    ProductCategory CategoryId,
    decimal Price,
    int Quantity
);