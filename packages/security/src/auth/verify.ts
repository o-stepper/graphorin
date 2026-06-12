/**
 * Server token verification pipeline. Combines the structural pre-
 * filter (`verifyOffline`), the warm-path LRU cache, an HMAC-SHA256
 * computation against the active server pepper, and a lookup against
 * the injected `AuthTokenStore`.
 *
 * Brute-force defences:
 * - Per-IP rate limit + lockout (sliding-window counter).
 * - Per-token lockout after a configurable number of consecutive
 *   misses; permanent until an operator runs `revokeToken` and reissues.
 * - Global concurrent-verify cap; the cap is the smallest of the
 *   configured value and `os.availableParallelism()`-derived defaults.
 *
 * The pipeline is purely a library function; HTTP middleware lives
 * in `@graphorin/server` and consumes this surface.
 *
 * @packageDocumentation
 */

import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';

import type { AuthTokenRecord, AuthTokenStore } from '@graphorin/core/contracts';

import type { SecretValue } from '../secrets/secret-value.js';
import { emitAuthAudit } from './audit-emitter.js';
import { assertPepperStrength } from './crud.js';
import { TokenVerifyOverloadError } from './errors.js';
import { LruCache } from './lru.js';
import { type ParsedScope, parseScope, scopeMatches, tryParseScope } from './scope.js';
import {
  DEFAULT_TOKEN_PREFIX,
  type ParseTokenOptions,
  parseToken,
  TOKEN_VERSION,
} from './token-format.js';

/**
 * Result of a successful `verifyToken(...)` call. The shape is the
 * minimum that callers (HTTP middleware, RPC handlers, CLI auth)
 * need to make an authorization decision.
 *
 * @stable
 */
export interface VerifiedToken {
  readonly tokenId: string;
  readonly label?: string;
  readonly scopes: ReadonlyArray<ParsedScope>;
  readonly env: string;
  readonly expiresAt?: number;
}

/**
 * Discriminated result of a verify call. The pipeline never throws
 * on the unhappy path so callers can map `reason` directly to an
 * HTTP status code without try/catch in their hot path.
 *
 * @stable
 */
export type VerifyResult =
  | { readonly ok: true; readonly token: VerifiedToken }
  | { readonly ok: false; readonly reason: VerifyFailureReason; readonly retryAfterMs?: number };

/**
 * Reasons a verify call can fail. Each value is a stable lowercase
 * discriminator suitable for direct logging.
 *
 * @stable
 */
export type VerifyFailureReason =
  | 'malformed'
  | 'unknown-token'
  | 'revoked'
  | 'expired'
  | 'ip-locked-out'
  | 'token-locked-out';

/**
 * Options that govern the rate-limit, lockout, and cache behaviour of
 * the verify pipeline.
 *
 * @stable
 */
export interface VerifierOptions {
  readonly tokenStore: AuthTokenStore;
  /**
   * Pepper used to derive the per-token HMAC. The pepper is supplied
   * as a `SecretValue` so its bytes never live in a plain string at
   * rest.
   */
  readonly pepper: SecretValue;
  /** Optional accepted prefix override for `parseToken(...)`. */
  readonly acceptPrefix?: string;
  /** Optional accepted environments override for `parseToken(...)`. */
  readonly acceptEnvironments?: ReadonlyArray<string>;
  /** Cache size for the warm-path lookup. Defaults to 1024. */
  readonly cacheCapacity?: number;
  /** Hard cap on cache TTL in ms. Defaults to 60 000 (60 s). */
  readonly cacheTtlMaxMs?: number;
  /** Per-IP failure threshold inside the sliding window. Defaults to 5. */
  readonly perIpFailureThreshold?: number;
  /** Sliding-window length in ms for the per-IP counter. Defaults to 60 000 (60 s). */
  readonly perIpWindowMs?: number;
  /** Lockout duration in ms after the per-IP counter trips. Defaults to 5 * 60 000 (5 min). */
  readonly perIpLockoutMs?: number;
  /** Per-token failure threshold. Defaults to 10. */
  readonly perTokenFailureThreshold?: number;
  /** Sliding-window length in ms for the per-token counter. Defaults to 5 * 60 000 (5 min). */
  readonly perTokenWindowMs?: number;
  /** Concurrent-verify cap. Defaults to 100. */
  readonly maxConcurrentVerify?: number;
  /**
   * Cap on distinct IPs tracked in the failure/lockout maps (SPL-19).
   * Default 10 000 — overflow sweeps expired lockouts, then evicts the
   * oldest entries.
   */
  readonly maxTrackedIps?: number;
  /** Wall-clock provider for testing. Defaults to `Date.now`. */
  readonly now?: () => number;
}

/**
 * Optional context surfaced to the verify pipeline.
 *
 * @stable
 */
export interface VerifyContext {
  /** Caller IP address (or pseudonymous hash). Used by the per-IP rate limit. */
  readonly ip?: string;
}

/**
 * Diagnostic snapshot for the rate limiter and concurrent-verify cap.
 * Used by health endpoints / `graphorin doctor` once those ship.
 *
 * @stable
 */
export interface TokenVerifierStatus {
  readonly cacheSize: number;
  readonly inFlight: number;
  /** Distinct IPs currently in the failure window map (SPL-19, capped). */
  readonly perIpFailures: number;
  readonly perIpLockouts: number;
  readonly perTokenLockouts: number;
}

/**
 * Stateful verifier. One instance is constructed per server runtime;
 * tests use the optional `now` to drive the sliding windows.
 *
 * @stable
 */
export class TokenVerifier {
  readonly #tokenStore: AuthTokenStore;
  readonly #pepper: SecretValue;
  readonly #parseOpts: ParseTokenOptions;
  readonly #cache: LruCache<string, CachedAuth>;
  readonly #cacheTtlMaxMs: number;
  readonly #perIpThreshold: number;
  readonly #perIpWindowMs: number;
  readonly #perIpLockoutMs: number;
  readonly #perTokenThreshold: number;
  readonly #perTokenWindowMs: number;
  readonly #maxConcurrent: number;
  readonly #now: () => number;
  readonly #maxTrackedIps: number;
  readonly #ipFailures = new Map<string, RateWindow>();
  readonly #ipLockouts = new Map<string, number>();
  readonly #tokenFailures = new Map<string, RateWindow>();
  readonly #tokenLockouts = new Set<string>();
  #inFlight = 0;

  constructor(options: VerifierOptions) {
    this.#tokenStore = options.tokenStore;
    this.#pepper = options.pepper;
    this.#parseOpts = pickParseOpts(options);
    this.#cache = new LruCache(options.cacheCapacity ?? 1024);
    this.#cacheTtlMaxMs = options.cacheTtlMaxMs ?? 60_000;
    this.#perIpThreshold = options.perIpFailureThreshold ?? 5;
    this.#perIpWindowMs = options.perIpWindowMs ?? 60_000;
    this.#perIpLockoutMs = options.perIpLockoutMs ?? 5 * 60_000;
    this.#perTokenThreshold = options.perTokenFailureThreshold ?? 10;
    this.#perTokenWindowMs = options.perTokenWindowMs ?? 5 * 60_000;
    this.#maxConcurrent = options.maxConcurrentVerify ?? 100;
    this.#maxTrackedIps = options.maxTrackedIps ?? 10_000;
    this.#now = options.now ?? Date.now;
  }

  // SPL-11: a 1-byte pepper makes stolen hashes brute-forceable — the
  // strength check runs once, lazily (the constructor is sync), before
  // the first verification.
  #pepperStrengthChecked: Promise<void> | undefined;
  async #assertPepperOnce(): Promise<void> {
    this.#pepperStrengthChecked ??= assertPepperStrength(this.#pepper);
    await this.#pepperStrengthChecked;
  }

  /**
   * Run the verify pipeline against a single raw token. The promise
   * always resolves; failures surface as `{ ok: false, reason }` so
   * callers can map them straight to HTTP responses.
   *
   * @stable
   */
  async verify(rawToken: string, ctx: VerifyContext = {}): Promise<VerifyResult> {
    await this.#assertPepperOnce(); // SPL-11
    if (this.#inFlight >= this.#maxConcurrent) {
      throw new TokenVerifyOverloadError(this.#inFlight, this.#maxConcurrent);
    }
    this.#inFlight += 1;
    try {
      const now = this.#now();
      const ip = ctx.ip;
      if (ip !== undefined) {
        const lockedUntil = this.#ipLockouts.get(ip);
        if (lockedUntil !== undefined) {
          if (lockedUntil > now) {
            return Object.freeze({
              ok: false,
              reason: 'ip-locked-out' as const,
              retryAfterMs: lockedUntil - now,
            });
          }
          this.#ipLockouts.delete(ip);
        }
      }

      const parsed = parseToken(rawToken, this.#parseOpts);
      if (!parsed.ok) {
        this.#noteIpFailure(ip, now);
        return Object.freeze({ ok: false, reason: 'malformed' as const });
      }

      const hashHex = await this.#hmac(rawToken);
      const cached = this.#cache.get(hashHex, now);
      if (cached !== undefined) {
        if (cached.expiresAt !== undefined && cached.expiresAt <= now) {
          this.#cache.delete(hashHex);
          this.#noteIpFailure(ip, now);
          return Object.freeze({ ok: false, reason: 'expired' as const });
        }
        return Object.freeze({ ok: true, token: cached.token });
      }

      const tokenId = await this.#findTokenId(hashHex);
      if (tokenId === undefined) {
        this.#noteIpFailure(ip, now);
        return Object.freeze({ ok: false, reason: 'unknown-token' as const });
      }

      if (this.#tokenLockouts.has(tokenId)) {
        emitAuthAudit({
          action: 'auth:denied:lockout',
          decision: 'denied',
          ts: now,
          target: tokenId,
          ...(ip === undefined ? {} : { metadata: { ip } }),
        });
        return Object.freeze({ ok: false, reason: 'token-locked-out' as const });
      }

      const record = await this.#tokenStore.get(tokenId);
      if (record === null) {
        this.#noteIpFailure(ip, now);
        return Object.freeze({ ok: false, reason: 'unknown-token' as const });
      }
      if (record.revokedAt !== undefined) {
        this.#noteTokenFailure(tokenId, now);
        this.#noteIpFailure(ip, now);
        return Object.freeze({ ok: false, reason: 'revoked' as const });
      }
      const expiresAtMs = record.expiresAt === undefined ? undefined : Date.parse(record.expiresAt);
      if (expiresAtMs !== undefined && Number.isFinite(expiresAtMs) && expiresAtMs <= now) {
        this.#noteTokenFailure(tokenId, now);
        this.#noteIpFailure(ip, now);
        return Object.freeze({ ok: false, reason: 'expired' as const });
      }

      const verified = recordToVerified(record, parsed.env, expiresAtMs);
      const ttlMs = computeCacheTtlMs(now, expiresAtMs, this.#cacheTtlMaxMs);
      this.#cache.set(
        hashHex,
        Object.freeze({
          token: verified,
          ...(expiresAtMs === undefined ? {} : { expiresAt: expiresAtMs }),
        }),
        ttlMs,
        now,
      );

      // Best-effort last-used update; never block the verify path.
      void this.#tokenStore.recordUse(tokenId, new Date(now).toISOString()).catch(() => {
        /* swallow — last-used is opportunistic. */
      });

      emitAuthAudit({ action: 'auth:granted', decision: 'success', ts: now, target: tokenId });
      return Object.freeze({ ok: true, token: verified });
    } finally {
      this.#inFlight = Math.max(0, this.#inFlight - 1);
    }
  }

  /**
   * Snapshot of the verifier's current load. Useful for the
   * `/v1/health/secrets` endpoint and for in-process metrics.
   *
   * @stable
   */
  status(): TokenVerifierStatus {
    return Object.freeze({
      cacheSize: this.#cache.size,
      inFlight: this.#inFlight,
      perIpFailures: this.#ipFailures.size,
      perIpLockouts: this.#ipLockouts.size,
      perTokenLockouts: this.#tokenLockouts.size,
    });
  }

  /** Force-evict a single token from the warm cache. */
  invalidate(rawTokenOrHashHex: string): void {
    if (rawTokenOrHashHex.length === 64 && /^[0-9a-f]+$/.test(rawTokenOrHashHex)) {
      this.#cache.delete(rawTokenOrHashHex);
      return;
    }
    void this.#hmac(rawTokenOrHashHex).then((hashHex) => this.#cache.delete(hashHex));
  }

  /** Drop every cached entry. */
  invalidateAll(): void {
    this.#cache.clear();
  }

  /** Lift a per-token lockout. Used by `revokeToken` / `rotateToken`. */
  clearTokenLockout(tokenId: string): void {
    this.#tokenLockouts.delete(tokenId);
    this.#tokenFailures.delete(tokenId);
  }

  /** Lift a per-IP lockout. Used by privileged operators. */
  clearIpLockout(ip: string): void {
    this.#ipLockouts.delete(ip);
    this.#ipFailures.delete(ip);
  }

  /** Throw an overload error if invoked. Test hook for the cap. */
  _simulateOverloadForTesting(): never {
    throw new TokenVerifyOverloadError(this.#maxConcurrent, this.#maxConcurrent);
  }

  /**
   * Lookup the token id associated with the HMAC hash. The default
   * implementation walks the full list — subclasses / wrappers can
   * pass a custom `AuthTokenStore` that supports an indexed lookup.
   */
  async #findTokenId(hashHex: string): Promise<string | undefined> {
    // SPL-19: indexed lookup when the store supports it — the re-check
    // keeps the timing-safe comparison on the returned row.
    if (typeof this.#tokenStore.getByHash === 'function') {
      const record = await this.#tokenStore.getByHash(hashHex);
      return record !== null && timingSafeEqualHex(record.hashHex, hashHex) ? record.id : undefined;
    }
    const records = await this.#tokenStore.list();
    for (const record of records) {
      if (timingSafeEqualHex(record.hashHex, hashHex)) return record.id;
    }
    return undefined;
  }

  /** Compute HMAC-SHA256(pepper, rawToken). */
  async #hmac(rawToken: string): Promise<string> {
    return await this.#pepper.useBuffer((pepper) =>
      createHmac('sha256', pepper).update(rawToken, 'utf8').digest('hex'),
    );
  }

  #noteIpFailure(ip: string | undefined, now: number): void {
    if (ip === undefined) return;
    const window = this.#ipFailures.get(ip) ?? new RateWindow();
    window.record(now, this.#perIpWindowMs);
    if (window.count >= this.#perIpThreshold) {
      this.#ipLockouts.set(ip, now + this.#perIpLockoutMs);
      this.#ipFailures.delete(ip);
    } else {
      this.#ipFailures.set(ip, window);
    }
    this.#boundIpMaps(now);
  }

  /**
   * SPL-19: an IPv6-rotating attacker must not inflate the per-IP maps
   * without bound — each map is capped at `maxTrackedIps` (default
   * 10 000). On overflow, expired lockouts sweep first; then the
   * oldest-inserted entries evict (insertion order ≈ least recently
   * created — a bounded approximation, deliberately cheap).
   */
  #boundIpMaps(now: number): void {
    if (this.#ipLockouts.size > this.#maxTrackedIps) {
      for (const [ip, until] of this.#ipLockouts) {
        if (until <= now) this.#ipLockouts.delete(ip);
      }
      while (this.#ipLockouts.size > this.#maxTrackedIps) {
        const oldest = this.#ipLockouts.keys().next().value;
        if (oldest === undefined) break;
        this.#ipLockouts.delete(oldest);
      }
    }
    while (this.#ipFailures.size > this.#maxTrackedIps) {
      const oldest = this.#ipFailures.keys().next().value;
      if (oldest === undefined) break;
      this.#ipFailures.delete(oldest);
    }
  }

  #noteTokenFailure(tokenId: string, now: number): void {
    const window = this.#tokenFailures.get(tokenId) ?? new RateWindow();
    window.record(now, this.#perTokenWindowMs);
    if (window.count >= this.#perTokenThreshold) {
      this.#tokenLockouts.add(tokenId);
      this.#tokenFailures.delete(tokenId);
    } else {
      this.#tokenFailures.set(tokenId, window);
    }
  }
}

/**
 * Functional convenience wrapper around `TokenVerifier#verify`. The
 * stateless variant constructs a one-shot verifier per call and is
 * **only** suitable for tests; production code holds a long-lived
 * `TokenVerifier` so the warm cache earns its keep.
 *
 * @stable
 */
export async function verifyToken(
  rawToken: string,
  options: VerifierOptions,
  ctx?: VerifyContext,
): Promise<VerifyResult> {
  const verifier = new TokenVerifier(options);
  return verifier.verify(rawToken, ctx);
}

/**
 * Helper that authorises a parsed verify result against a required
 * scope. Keeps the scope plumbing close to the rest of the auth
 * surface so callers do not have to import from two places.
 *
 * @stable
 */
export function authorize(
  result: VerifyResult,
  required: string | ParsedScope,
):
  | { readonly ok: true; readonly token: VerifiedToken }
  | { readonly ok: false; readonly reason: 'unauthenticated' | 'insufficient-scope' } {
  if (!result.ok) return Object.freeze({ ok: false, reason: 'unauthenticated' as const });
  const requiredScope = typeof required === 'string' ? parseScope(required) : required;
  for (const scope of result.token.scopes) {
    if (scopeMatches(scope, requiredScope)) {
      return Object.freeze({ ok: true, token: result.token });
    }
  }
  return Object.freeze({ ok: false, reason: 'insufficient-scope' as const });
}

interface CachedAuth {
  readonly token: VerifiedToken;
  readonly expiresAt?: number;
}

/**
 * SPL-19 (documented semantics): a TOUCH-RESET window, not a true
 * sliding window — the count resets only after `windowMs` of full
 * silence; continuous traffic keeps accumulating within one logical
 * window. Deliberately cheap (two fields per key); operators needing
 * exact sliding semantics put a rate limiter in front of the server.
 */
class RateWindow {
  count = 0;
  #lastTouch = 0;

  record(now: number, windowMs: number): void {
    if (now - this.#lastTouch > windowMs) {
      this.count = 1;
    } else {
      this.count += 1;
    }
    this.#lastTouch = now;
  }
}

function pickParseOpts(options: VerifierOptions): ParseTokenOptions {
  const opts: ParseTokenOptions = {
    acceptPrefix: options.acceptPrefix ?? DEFAULT_TOKEN_PREFIX,
  };
  if (options.acceptEnvironments !== undefined) {
    return { ...opts, acceptEnvironments: options.acceptEnvironments };
  }
  return opts;
}

function recordToVerified(
  record: AuthTokenRecord,
  env: string,
  expiresAt: number | undefined,
): VerifiedToken {
  const scopes: ParsedScope[] = [];
  for (const raw of record.scopes) {
    const parsed = tryParseScope(raw);
    if (parsed !== undefined) scopes.push(parsed);
  }
  return Object.freeze({
    tokenId: record.id,
    ...(record.label === undefined ? {} : { label: record.label }),
    scopes: Object.freeze(scopes),
    env,
    ...(expiresAt === undefined ? {} : { expiresAt }),
  });
}

function computeCacheTtlMs(
  now: number,
  expiresAtMs: number | undefined,
  cacheTtlMaxMs: number,
): number {
  if (expiresAtMs === undefined) return cacheTtlMaxMs;
  const remaining = Math.max(0, expiresAtMs - now);
  return Math.min(cacheTtlMaxMs, remaining);
}

/**
 * Constant-time hex comparison. Avoids leaking the per-char divergence
 * point that `String#localeCompare` would expose.
 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  if (aBuf.length === 0 || aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

void TOKEN_VERSION;
