/**
 * Middleware barrel for `@graphorin/server`. Every entry is a Hono
 * `MiddlewareHandler`; they are composed by the `createServer({...})`
 * factory in a fixed order:
 *
 *   request-state -> cors -> request audit metadata -> rate-limit ->
 *   csrf -> auth -> scope (per-route) -> idempotency (per-route) ->
 *   audit -> handler
 *
 * Operators that build a custom Hono app (or wrap the framework one)
 * can re-import these factories directly through this barrel.
 *
 * @packageDocumentation
 */

export {
  type AuditErrorSink,
  type AuditMiddlewareOptions,
  createAuditMiddleware,
  HTTP_REQUEST_AUDIT_ACTION,
} from './audit.js';
export {
  type AuthMiddlewareOptions,
  createAnonymousAuthMiddleware,
  createAuthMiddleware,
} from './auth.js';
export { createCorsMiddleware } from './cors.js';
export { createCsrfMiddleware } from './csrf.js';
export {
  createIdempotencyMiddleware,
  type IdempotencyMiddlewareOptions,
} from './idempotency.js';
export { createRateLimitMiddleware } from './rate-limit.js';
export {
  createRequestStateMiddleware,
  type RequestStateMiddlewareOptions,
} from './request-state.js';
export { createScopeMiddleware, type ScopeRequirement } from './scope.js';
