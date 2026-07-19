/**
 * REST `Idempotency-Key` middleware per IETF
 * draft-ietf-httpapi-idempotency-key-header-07. Layers an LRU
 * read-cache over a durable {@link IdempotencyStore} so:
 *
 * - Replays of a successful request return the cached response body
 *   AND the original status code, with a synthetic
 *   `Idempotency-Replayed: true` header so clients can distinguish
 *   the cached path.
 * - Replays of a key with a different request body return `409
 *   Conflict` and a typed error body (per ADR-036 / DEC-142).
 * - 5xx + 408 + 429 + 503 responses are NOT cached so transient
 *   errors do not pin the operator into a non-recoverable state.
 *
 * Streaming endpoints (`/v1/agents/:id/stream`,
 * `/v1/workflows/:id/execute` when invoked with the `stream=true`
 * query) cache only the initial 202 + `runId` envelope; the actual
 * event stream is replayed via the WebSocket layer (Phase 14b).
 *
 * @packageDocumentation
 */

import type { IdempotencyRecord, IdempotencyStore } from '@graphorin/store-sqlite';
import type { Context, MiddlewareHandler } from 'hono';

import type { ServerConfigSpec } from '../config.js';
import type { ServerVariables } from '../internal/context.js';
import { fingerprintRequest } from '../internal/json.js';
import { SERVER_METRIC_NAMES } from '../metrics/catalog.js';
import type { MetricRegistry } from '../metrics/registry.js';

const HEADER_NAME = 'idempotency-key';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);
// Status codes the IETF draft + Stripe convention exclude from
// idempotent caching (always retry-eligible).
const NON_CACHEABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const KEY_RE = /^[A-Za-z0-9_\-:]{8,255}$/;

/**
 * Options accepted by {@link createIdempotencyMiddleware}.
 *
 * @stable
 */
export interface IdempotencyMiddlewareOptions {
  /**
   * Paths whose responses are NEVER cached or replayed - the
   * middleware passes straight through. Used for secret-bearing
   * endpoints (`POST /v1/tokens` returns a raw token; caching it would
   * persist the secret plaintext in durable SQLite for the TTL).
   */
  readonly excludeResponseCachePaths?: ReadonlyArray<string>;
  readonly store: IdempotencyStore;
  readonly config: ServerConfigSpec['server']['idempotency'];
  /** Wall-clock provider; tests inject a deterministic generator. */
  readonly now?: () => number;
  /**
   * When supplied, the middleware publishes a live
   * `graphorin_idempotency_cache_hit_ratio` gauge (replays / replays+executes)
   * instead of leaving the registered metric a permanently-empty series.
   */
  readonly metricRegistry?: MetricRegistry;
}

interface CacheEntry {
  readonly record: IdempotencyRecord;
  readonly cachedAt: number;
}

/**
 * @stable
 */
export function createIdempotencyMiddleware(
  options: IdempotencyMiddlewareOptions,
): MiddlewareHandler<{ Variables: ServerVariables }> {
  const { store, config } = options;
  if (!config.enabled) {
    return async (_, next) => {
      await next();
    };
  }
  const now = options.now ?? Date.now;
  const lru = new SimpleLru<string, CacheEntry>(config.lruCacheSize);

  // periphery-08: keys whose execution is currently in flight - a
  // concurrent duplicate is rejected (409) instead of double-executing.
  const inFlight = new Set<string>();

  const excluded = new Set(options.excludeResponseCachePaths ?? []);

  // IP-15: publish the cache hit ratio as a live gauge. A "hit" is a replay
  // served from a stored record; a "miss" is a keyed request that executed
  // fresh. Conflicts (409) are abnormal and excluded from the ratio.
  const registry = options.metricRegistry;
  let hits = 0;
  let lookups = 0;
  const recordCacheOutcome = (hit: boolean): void => {
    if (registry === undefined) return;
    lookups += 1;
    if (hit) hits += 1;
    registry.set(SERVER_METRIC_NAMES.idempotencyCacheHitRatio, hits / lookups);
  };

  return async (c, next) => {
    if (SAFE_METHODS.has(c.req.method.toUpperCase())) {
      await next();
      return;
    }
    // IP-6: secret-bearing endpoints opt out of response caching
    // entirely - repeats re-execute and no body is ever persisted.
    if (excluded.has(c.req.path)) {
      await next();
      return;
    }
    const key = c.req.header(HEADER_NAME)?.trim();
    if (key === undefined || key.length === 0) {
      if (config.requireKey === 'enforce') {
        return c.json(
          {
            error: 'idempotency-key-required',
            message: 'Idempotency-Key header is required for this endpoint.',
            hint: "Set 'Idempotency-Key: <uuid>' on the request.",
          },
          400,
        );
      }
      // 'warn' / 'off' - pass-through with a hint header.
      if (config.requireKey === 'warn') {
        c.header('Idempotency-Status', 'header-missing');
      }
      await next();
      return;
    }
    if (!KEY_RE.test(key)) {
      return c.json(
        {
          error: 'idempotency-key-required',
          message: 'Idempotency-Key must be 8-255 chars of [A-Za-z0-9_:-].',
        },
        400,
      );
    }
    c.set('state', { ...c.get('state'), idempotencyKey: key });
    const fingerprint = await computeFingerprint(c);
    const cached = lru.get(key);
    let record: IdempotencyRecord | null;
    if (cached !== undefined && now() - cached.cachedAt < 5 * 60 * 1000) {
      record = cached.record;
    } else {
      record = await store.get(key);
      if (record !== null) {
        lru.set(key, { record, cachedAt: now() });
      }
    }
    // IP-6: the verified principal the record is bound to. Replays are
    // served only to the SAME principal that originally executed the
    // request (who passed the route's scope checks at execute time) -
    // a different token cannot fetch someone else's cached response,
    // closing the scope-bypass the pre-router mount opened.
    const auth = c.get('state').auth;
    const principal = auth.kind === 'token' ? auth.token.tokenId : 'anonymous';
    if (record !== null) {
      if (record.scope !== undefined && record.scope !== principal) {
        return c.json(
          {
            error: 'idempotency-conflict',
            message: `Idempotency-Key '${key}' is bound to a different principal.`,
          },
          409,
        );
      }
      if (config.checkBodyFingerprint && record.requestHash !== fingerprint) {
        return c.json(
          {
            error: 'idempotency-conflict',
            message: `Idempotency-Key '${key}' was previously used with a different request body.`,
          },
          409,
        );
      }
      if (record.expiresAt > now()) {
        c.set('state', { ...c.get('state'), idempotencyReplay: true });
        const headers = record.responseHeaders ?? {};
        for (const [name, value] of Object.entries(headers)) {
          c.header(name, value);
        }
        c.header('Idempotency-Replayed', 'true');
        recordCacheOutcome(true);
        return new Response(JSON.stringify(record.response), {
          status: record.statusCode,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Idempotency-Replayed': 'true',
          },
        });
      }
      // Expired - fall through to re-execute.
      lru.delete(key);
      await store.delete(key);
    }

    // periphery-08: the record is only written AFTER next(), so two
    // concurrent requests with the same key would both miss the cache
    // and both execute (a double agent run). Track in-flight keyed
    // executions in-process (the server is single-process by design)
    // and reject concurrent duplicates per
    // draft-ietf-httpapi-idempotency-key-header: 409 + Retry-After.
    // The key stays in-flight until the record is CACHED (or found
    // uncacheable), so a duplicate never slips in between execution
    // and the write.
    if (inFlight.has(key)) {
      c.header('Retry-After', '1');
      return c.json(
        {
          error: 'idempotency-in-flight',
          message: `A request with Idempotency-Key '${key}' is currently being processed.`,
        },
        409,
      );
    }
    inFlight.add(key);
    try {
      // A keyed request that reaches execution is a cache miss.
      recordCacheOutcome(false);
      await next();

      const status = c.res.status;
      if (NON_CACHEABLE_STATUS.has(status)) {
        // Retry-eligible - leave nothing in the cache.
        return;
      }
      const responseBody = await captureJsonResponse(c);
      if (responseBody === null) {
        // Non-JSON or empty body - skip caching to keep the schema
        // simple; clients that need response replay can use bodied
        // POSTs.
        return;
      }
      const responseHeaders = collectResponseHeaders(c);
      const record_: IdempotencyRecord = {
        key,
        requestHash: fingerprint,
        statusCode: status,
        response: responseBody,
        ...(responseHeaders !== undefined ? { responseHeaders } : {}),
        // IP-6: bind the record to the executing principal.
        scope: principal,
        createdAt: now(),
        expiresAt: now() + config.ttlSeconds * 1000,
      };
      try {
        await store.put(record_);
        lru.set(key, { record: record_, cachedAt: now() });
      } catch {
        // Best-effort cache. Persistence failures must not break the
        // hot path - operators see them via the audit log + logger.
      }
    } finally {
      inFlight.delete(key);
    }
  };
}

async function computeFingerprint(c: Context<{ Variables: ServerVariables }>): Promise<string> {
  let body: unknown = null;
  const ct = c.req.header('content-type');
  if (ct?.toLowerCase().includes('application/json')) {
    try {
      body = await c.req.json();
    } catch {
      body = await c.req.text();
    }
  } else {
    body = await c.req.text();
  }
  return fingerprintRequest(c.req.method, c.req.path, body);
}

async function captureJsonResponse(
  c: Context<{ Variables: ServerVariables }>,
): Promise<unknown | null> {
  if (c.res === undefined) return null;
  const contentType = c.res.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) return null;
  try {
    const cloned = c.res.clone();
    const text = await cloned.text();
    if (text.length === 0) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function collectResponseHeaders(
  c: Context<{ Variables: ServerVariables }>,
): Readonly<Record<string, string>> | undefined {
  if (c.res === undefined) return undefined;
  const out: Record<string, string> = {};
  c.res.headers.forEach((value, name) => {
    if (name.toLowerCase() === 'content-length') return;
    out[name] = value;
  });
  return Object.keys(out).length === 0 ? undefined : Object.freeze(out);
}

class SimpleLru<K, V> {
  readonly #capacity: number;
  readonly #map: Map<K, V> = new Map();

  constructor(capacity: number) {
    this.#capacity = Math.max(1, capacity);
  }

  get(key: K): V | undefined {
    const value = this.#map.get(key);
    if (value === undefined) return undefined;
    this.#map.delete(key);
    this.#map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.#map.has(key)) this.#map.delete(key);
    this.#map.set(key, value);
    while (this.#map.size > this.#capacity) {
      const oldestKey = this.#map.keys().next().value as K | undefined;
      if (oldestKey === undefined) break;
      this.#map.delete(oldestKey);
    }
  }

  delete(key: K): boolean {
    return this.#map.delete(key);
  }
}
