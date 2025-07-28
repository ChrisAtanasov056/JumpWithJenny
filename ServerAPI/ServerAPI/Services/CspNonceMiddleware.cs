using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
        var nonce = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        context.Items[NonceKey] = nonce;

        var csp = $"default-src 'self'; " +
                  $"style-src 'self' 'nonce-{nonce}' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
                  $"style-src-elem 'self' 'nonce-{nonce}' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
                  $"script-src 'self' 'nonce-{nonce}'; " +
                  $"font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
                  $"img-src 'self' data: https:; " +
                  $"connect-src 'self' https://jumpwithjenny.com https://api.jumpwithjenny.com https://localhost:7024; " +
                  $"frame-src 'self' https://www.google.com;";

        context.Response.Headers["Content-Security-Policy"] = csp;
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        await _next(context);
    }

    public static string GetNonce(HttpContext context)
    {
        return context.Items.TryGetValue(NonceKey, out var nonce) ? nonce?.ToString() : string.Empty;
    }
}
}