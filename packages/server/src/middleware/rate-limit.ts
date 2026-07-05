/**
 * Per-IP sliding-window rate limit. Defends against brute-force
 * authentication probes and naive DoS scenarios. The limit is
 * deliberately conservative - operators with multi-tenant traffic
 * should layer a dedicated reverse proxy on top.
 *
 * @packageDocumentation
 */

import type { MiddlewareHandler } from 'hono';

import type { ServerConfigSpec } from '../config.js';
import type { ServerVariables } from '../internal/context.js';

interface Window {
  count: number;
  start: number;
}

/**
 * @stable
 */
export function createRateLimitMiddleware(
  config: ServerConfigSpec['server']['rateLimit'],
  options: { readonly now?: () => number } = {},
): MiddlewareHandler<{ Variables: ServerVariables }> {
  if (!config.enabled) {
    return async (_, next) => {
      await next();
    };
  }
  const windows = new Map<string, Window>();
  const now = options.now ?? Date.now;
  // IP-10: bound the window map - expired entries are swept once the
  // map crosses the cap so an attacker rotating spoofed XFF values
  // (trustProxy=true deployments) cannot grow it without bound.
  const SWEEP_THRESHOLD = 10_000;
  const sweep = (ts: number): void => {
    if (windows.size < SWEEP_THRESHOLD) return;
    for (const [key, win] of windows) {
      if (ts - win.start >= config.windowMs) windows.delete(key);
    }
  };

  return async (c, next) => {
    const ip = c.get('state').clientIp ?? 'anonymous';
    const ts = now();
    sweep(ts);
    const window = windows.get(ip) ?? { count: 0, start: ts };
    if (ts - window.start >= config.windowMs) {
      window.start = ts;
      window.count = 0;
    }
    window.count += 1;
    windows.set(ip, window);
    const remaining = Math.max(0, config.perIpRequests - window.count);
    c.header('X-RateLimit-Limit', config.perIpRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header(
      'X-RateLimit-Reset',
      Math.max(0, Math.ceil((window.start + config.windowMs - ts) / 1000)).toString(),
    );
    if (window.count > config.perIpRequests) {
      const retryAfter = Math.max(0, Math.ceil((window.start + config.windowMs - ts) / 1000));
      return c.json({ error: 'rate-limit-exceeded', message: 'Too many requests.' }, 429, {
        'Retry-After': retryAfter.toString(),
      });
    }
    await next();
  };
}
