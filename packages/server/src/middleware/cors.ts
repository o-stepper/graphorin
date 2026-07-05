/**
 * Deny-by-default CORS middleware. The framework refuses to echo back
 * arbitrary origins; allowlist semantics match the threat-model
 * checklist in the runtime architecture.
 *
 * @packageDocumentation
 */

import type { MiddlewareHandler } from 'hono';

import type { ServerConfigSpec } from '../config.js';
import type { ServerVariables } from '../internal/context.js';

/**
 * @stable
 */
export function createCorsMiddleware(
  config: ServerConfigSpec['server']['cors'],
): MiddlewareHandler<{ Variables: ServerVariables }> {
  const allowSet = new Set(config.allowOrigins);
  const allowAny = allowSet.has('*');
  const allowMethods = config.allowMethods.join(', ');
  const allowHeaders = config.allowHeaders.join(', ');
  const maxAge = config.maxAgeSeconds.toString();

  return async (c, next) => {
    const origin = c.req.header('origin');
    const isPreflight =
      c.req.method === 'OPTIONS' && c.req.header('access-control-request-method') !== undefined;
    if (origin === undefined) {
      // Same-origin request - proceed without CORS headers.
      if (isPreflight) {
        return c.body(null, 204);
      }
      await next();
      return;
    }
    const allowed = allowAny || allowSet.has(origin);
    if (!allowed) {
      if (isPreflight) {
        return c.body(null, 204);
      }
      // Pass the request through but withhold the CORS allow header so
      // the browser blocks it; do NOT short-circuit the request - the
      // server-to-server flow must still receive a normal response.
      await next();
      return;
    }

    if (allowAny && config.allowCredentials) {
      // Specs forbid `Access-Control-Allow-Origin: *` with credentials;
      // mirror the request origin instead.
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Vary', 'Origin');
    } else if (allowAny) {
      c.header('Access-Control-Allow-Origin', '*');
    } else {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Vary', 'Origin');
    }
    if (config.allowCredentials) {
      c.header('Access-Control-Allow-Credentials', 'true');
    }
    if (isPreflight) {
      c.header('Access-Control-Allow-Methods', allowMethods);
      c.header('Access-Control-Allow-Headers', allowHeaders);
      c.header('Access-Control-Max-Age', maxAge);
      return c.body(null, 204);
    }
    await next();
  };
}
