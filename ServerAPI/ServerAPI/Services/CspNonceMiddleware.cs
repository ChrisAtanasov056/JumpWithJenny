using System.Security.Cryptography;

namespace ServerAPI.Services
{
public class CspNonceMiddleware
{
    private readonly RequestDelegate _next;
    private const string NonceKey = "CspNonce";

    public CspNonceMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var nonce = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        context.Items[NonceKey] = nonce;

        var csp = $"default-src 'self'; " +
                  $"style-src 'self' 'nonce-{nonce}' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
                  $"style-src-elem 'self' 'nonce-{nonce}' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
                  $"script-src 'self' 'nonce-{nonce}'; " +
                  $"font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
                  $"img-src 'self' data: https:; " +
                  $"connect-src 'self' https://jumpwithjenny.com https://www.jumpwithjenny.com https://api.jumpwithjenny.com; " +
                  $"frame-src 'self' https://www.google.com; " +
                  $"object-src 'none'; base-uri 'self'; frame-ancestors 'self';";

        context.Response.Headers["Content-Security-Policy"] = csp;
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        await _next(context);
    }

    public static string GetNonce(HttpContext context)
    {
        return context.Items.TryGetValue(NonceKey, out var nonce) ? nonce?.ToString() : string.Empty;
    }
}
}