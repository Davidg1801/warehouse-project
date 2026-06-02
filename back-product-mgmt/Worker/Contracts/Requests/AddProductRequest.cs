using Core.Entities;

namespace Worker.Contracts.Request;

public record AddProductRequest(
    string Name,
    ProductCategory CategoryId,
    decimal Price,
    int Quantity
);