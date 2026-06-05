namespace back_warehouse_bff.Contracts.Common;

//Envelope pattern
/* 
{
    "Success" : true | false,
    "Message" : "string" | null,
    "Errors" : "string" | null,
    "Data" : {} | [] | "" | null
}
*/
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }
    public T? Data { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null)
        => new ApiResponse<T> { Data = data, Success = true, Message = message };
    public static ApiResponse<T> Fail(string error)
        => new ApiResponse<T> { Success = false, Errors = new List<string> { error } };
    public static ApiResponse<T> Fail(List<string> errors)
        => new ApiResponse<T> { Success = false, Errors = errors };
}