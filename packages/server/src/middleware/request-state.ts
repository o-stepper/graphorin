/**
 * Bootstraps the per-request `c.var.state` slot. Every server-owned
 * middleware downstream reads from this object; defaults are kept on
 * a single line per field so the structure is auditable at a glance.
 *
 * @packageDocumentation
 */

import type { MiddlewareHandler } from 'hono';

import type { ServerRequestState, ServerVariables } from '../internal/context.js';
import { newRequestId } from '../internal/ids.js';

/**
 * @stable
 */
export interface RequestStateMiddlewareOptions {
  /** Override the wall clock; tests inject a fixed value. */
  readonly now?: () => number;
  /** Override the request id generator. */
  readonly newRequestId?: () => string;
  /** Trust `X-Forwarded-For`/`X-Real-IP` for the client IP. Default false. */
  readonly trustProxy?: boolean;
  /** Echo the request id back to the client. Default `'X-Request-Id'`. */
  readonly responseHeader?: string | false;
}

function clientIp(
  headerLookup: (name: string) => string | undefined,
  trustProxy: boolean,
): string | undefined {
  if (trustProxy) {
    const xff = headerLookup('x-forwarded-for');
    if (xff !== undefined && xff.length > 0) {
      const [first] = xff.split(',');
      if (first !== undefined) return first.trim();
    }
    const xri = headerLookup('x-real-ip');
    if (xri !== undefined && xri.length > 0) return xri.trim();
  }
  return undefined;
}

/**
 * @stable
 */
export function createRequestStateMiddleware(
  options: RequestStateMiddlewareOptions = {},
): MiddlewareHandler<{ Variables: ServerVariables }> {
  const now = options.now ?? Date.now;
  const idFactory = options.newRequestId ?? newRequestId;
  const trustProxy = options.trustProxy ?? false;
  const responseHeader =
    options.responseHeader === undefined ? 'X-Request-Id' : options.responseHeader;

  return async (c, next) => {
    const headerLookup = (name: string): string | undefined => c.req.header(name);
    const requestId = headerLookup('x-request-id')?.trim() || idFactory();
    // IP-10: with the default trustProxy=false the proxy headers are
    // ignored — the client IP comes from the SOCKET, so per-IP rate
    // limits and lockouts actually key per client instead of dumping
    // every request into one shared 'anonymous' bucket.
    const socketAddress = (
      c.env as { incoming?: { socket?: { remoteAddress?: string } } } | undefined
    )?.incoming?.socket?.remoteAddress;
    const ip = clientIp(headerLookup, trustProxy) ?? socketAddress;
    const state: ServerRequestState = {
      requestId,
      receivedAt: now(),
      clientIp: ip,
      auth: { kind: 'unauthenticated' },
    };
    c.set('state', state);
    if (responseHeader !== false) {
      c.header(responseHeader, requestId);
    }
    await next();
  };
}
