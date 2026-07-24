namespace Worker.Contracts.Response;

public class ReserveStockResponse
{
    public bool Success { get; set; } = true;
    public List<string> Errors { get; set; } = new();
}