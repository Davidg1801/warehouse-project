namespace Core.Results;

public class ReserveStockResult
{
    public bool Success { get; set; } = true;
    public List<string> Errors { get; set; } = new();
}