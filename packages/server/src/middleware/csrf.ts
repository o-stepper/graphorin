/**
 * Double-submit CSRF middleware. Targets browser flows: when a
 * request carries a session-cookie style credential we require the
 * client to echo the value of the `graphorin_csrf` cookie back in
 * the `X-CSRF-Token` header. Bearer-token (Authorization header)
 * requests are exempt because they are not vulnerable to the
 * confused-deputy attack the cookie pattern guards against.
 *
 * @packageDocumentation
 */

import { Buffer } from 'node:buffer';
import { randomBytes, timingSafeEqual } from 'node:crypto';

import type { MiddlewareHandler } from 'hono';

import type { ServerConfigSpec } from '../config.js';
import type { ServerVariables } from '../internal/context.js';

/**
 * @stable
 */
export function createCsrfMiddleware(
  config: ServerConfigSpec['server']['csrf'],
): MiddlewareHandler<{ Variables: ServerVariables }> {
  if (!config.enabled) {
    return async (_, next) => {
      await next();
    };
  }
  const safeMethods = new Set(config.safeMethods.map((m) => m.toUpperCase()));

  return async (c, next) => {
    const method = c.req.method.toUpperCase();
    const cookieHeader = c.req.header('cookie');
    const cookies = parseCookies(cookieHeader);
    const cookieValue = cookies.get(config.cookieName);
    const authHeader = c.req.header('authorization');
    const isBearer = authHeader !== undefined && /^bearer\s+/i.test(authHeader);

    if (safeMethods.has(method) || isBearer) {
      // Always issue a fresh CSRF cookie on browser flows so SPAs
      // can read it on first load. Skip the cookie issuance for
      // bearer-only callers — they don't need it.
      if (!isBearer && cookieValue === undefined) {
        const token = randomBytes(24).toString('base64url');
        c.header(
          'Set-Cookie',
          `${config.cookieName}=${token}; Path=/; SameSite=Strict; HttpOnly=false; Secure`,
        );
      }
      await next();
      return;
    }

    if (cookieValue === undefined) {
      return c.json(
        { error: 'csrf-denied', message: 'CSRF cookie missing on state-changing request.' },
        403,
      );
    }
    const headerValue = c.req.header(config.headerName);
    if (headerValue === undefined) {
      return c.json(
        { error: 'csrf-denied', message: `CSRF header '${config.headerName}' missing.` },
        403,
      );
    }
    if (!constantTimeEqual(cookieValue, headerValue)) {
      return c.json({ error: 'csrf-denied', message: 'CSRF token mismatch.' }, 403);
    }
    await next();
  };
}

function parseCookies(header: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  if (header === undefined) return out;
  const parts = header.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length === 0) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    out.set(name, value);
  }
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
