[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / middleware

# middleware

Middleware barrel for `@graphorin/server`. Every entry is a Hono
`MiddlewareHandler`; they are composed by the `createServer({...})`
factory in a fixed order:

  request-state -> cors -> request audit metadata -> rate-limit ->
  csrf -> auth -> scope (per-route) -> idempotency (per-route) ->
  audit -> handler

Operators that build a custom Hono app (or wrap the framework one)
can re-import these factories directly through this barrel.

## Functions

| Function | Description |
| ------ | ------ |
| [createAnonymousAuthMiddleware](/api/@graphorin/server/middleware/functions/createAnonymousAuthMiddleware.md) | Build the no-auth middleware mounted when `auth.kind = 'none'`. It stamps `state.auth = { kind: 'anonymous', grantedScopes: [admin:*] }` so the scope middleware, SSE handler and replay routes all treat the request as a fully-authorized principal. This is the documented trusted-loopback / single-operator mode - never mount it on a non-loopback deployment without understanding that every endpoint becomes open. |

## References

### AuditErrorSink

Re-exports [AuditErrorSink](/api/@graphorin/server/type-aliases/AuditErrorSink.md)

***

### AuditMiddlewareOptions

Re-exports [AuditMiddlewareOptions](/api/@graphorin/server/interfaces/AuditMiddlewareOptions.md)

***

### AuthMiddlewareOptions

Re-exports [AuthMiddlewareOptions](/api/@graphorin/server/interfaces/AuthMiddlewareOptions.md)

***

### createAuditMiddleware

Re-exports [createAuditMiddleware](/api/@graphorin/server/functions/createAuditMiddleware.md)

***

### createAuthMiddleware

Re-exports [createAuthMiddleware](/api/@graphorin/server/functions/createAuthMiddleware.md)

***

### createCorsMiddleware

Re-exports [createCorsMiddleware](/api/@graphorin/server/functions/createCorsMiddleware.md)

***

### createCsrfMiddleware

Re-exports [createCsrfMiddleware](/api/@graphorin/server/functions/createCsrfMiddleware.md)

***

### createIdempotencyMiddleware

Re-exports [createIdempotencyMiddleware](/api/@graphorin/server/functions/createIdempotencyMiddleware.md)

***

### createRateLimitMiddleware

Re-exports [createRateLimitMiddleware](/api/@graphorin/server/functions/createRateLimitMiddleware.md)

***

### createRequestStateMiddleware

Re-exports [createRequestStateMiddleware](/api/@graphorin/server/functions/createRequestStateMiddleware.md)

***

### createScopeMiddleware

Re-exports [createScopeMiddleware](/api/@graphorin/server/functions/createScopeMiddleware.md)

***

### HTTP\_REQUEST\_AUDIT\_ACTION

Re-exports [HTTP_REQUEST_AUDIT_ACTION](/api/@graphorin/server/variables/HTTP_REQUEST_AUDIT_ACTION.md)

***

### IdempotencyMiddlewareOptions

Re-exports [IdempotencyMiddlewareOptions](/api/@graphorin/server/interfaces/IdempotencyMiddlewareOptions.md)

***

### RequestStateMiddlewareOptions

Re-exports [RequestStateMiddlewareOptions](/api/@graphorin/server/interfaces/RequestStateMiddlewareOptions.md)

***

### ScopeRequirement

Re-exports [ScopeRequirement](/api/@graphorin/server/type-aliases/ScopeRequirement.md)
