/**
 * Token CRUD library functions. Each function is a thin wrapper around
 * the cross-package `AuthTokenStore` contract; the persistence layer
 * (default `@graphorin/store-sqlite`) supplies the concrete store.
 *
 * Every function returns immutable, frozen records and never logs the
 * raw token value. Audit emission is the caller's responsibility — a
 * follow-up commit will bridge the helpers to the audit subsystem.
 *
 * @packageDocumentation
 */

import { createHmac, randomBytes, randomUUID } from 'node:crypto';

import type { AuthTokenRecord, AuthTokenStore } from '@graphorin/core/contracts';

import { assessSecretStrength } from '../hardening/weak-secret.js';
import { SecretValue } from '../secrets/secret-value.js';
import { emitAuthAudit } from './audit-emitter.js';
import { WeakPepperError } from './errors.js';
import { validateScopeSet } from './scope.js';
import { generateRawToken, type TokenEnvironment } from './token-format.js';

/**
 * Options for `createToken(...)`.
 *
 * @stable
 */
export interface CreateTokenOptions {
  readonly tokenStore: AuthTokenStore;
  readonly pepper: SecretValue;
  readonly env: TokenEnvironment | string;
  readonly scopes: ReadonlyArray<string>;
  readonly label?: string;
  readonly prefix?: string;
  /** Optional millisecond-precision expiry. Mutually exclusive with `expiresAt`. */
  readonly expiresInMs?: number;
  /** Optional explicit expiry as a Date or epoch ms. */
  readonly expiresAt?: Date | number;
  /** Optional id override (used by `rotateToken`); defaults to a random UUID. */
  readonly idOverride?: string;
  /** Wall-clock provider for tests. Defaults to `Date.now`. */
  readonly now?: () => number;
}

/**
 * Result of `createToken(...)`. The raw token is a `SecretValue` so it
 * is never accidentally logged on the way back to the caller.
 *
 * @stable
 */
export interface CreatedToken {
  readonly raw: SecretValue;
  readonly record: AuthTokenRecord;
}

/**
 * Mint a new token, persist its HMAC hash through the injected store,
 * and return the raw token wrapped in a `SecretValue`. The plaintext
 * value is shown to the user exactly once — at the call site of this
 * function.
 *
 * @stable
 */
export async function createToken(options: CreateTokenOptions): Promise<CreatedToken> {
  const scopeErrors = validateScopeSet(options.scopes);
  if (scopeErrors.length > 0) {
    const [first] = scopeErrors;
    if (first !== undefined) throw first;
  }

  const now = options.now ?? Date.now;
  // SPL-11: a weak pepper makes stolen hashHex offline-brute-forceable —
  // enforce strength wherever a pepper is consumed, not only in rotation.
  await assertPepperStrength(options.pepper);
  const generated = generateRawToken({
    env: options.env,
    ...(options.prefix === undefined ? {} : { prefix: options.prefix }),
  });

  const hashHex = await hmacHexAsync(options.pepper, generated.raw);
  const id = options.idOverride ?? randomUUID();
  const createdAt = new Date(now()).toISOString();
  const expiresAt = resolveExpiresAt(options, now);

  const record: AuthTokenRecord = Object.freeze({
    id,
    hashHex,
    ...(options.label === undefined ? {} : { label: options.label }),
    scopes: Object.freeze([...options.scopes]),
    createdAt,
    ...(expiresAt === undefined ? {} : { expiresAt }),
  });
  await options.tokenStore.put(record);

  emitAuthAudit({
    action: 'token:create',
    decision: 'success',
    ts: now(),
    target: id,
    metadata: { scopes: [...options.scopes], env: String(options.env) },
  });

  return Object.freeze({
    raw: SecretValue.fromString(generated.raw, {
      source: { resolver: 'createToken', ref: `token:${id}` },
    }),
    record,
  });
}

/**
 * List token metadata. Never returns the raw token or the HMAC hash;
 * the hash is hex on-disk only and would otherwise be a small offline
 * brute-force vector if both the database **and** the pepper were
 * compromised.
 *
 * @stable
 */
export async function listTokens(
  tokenStore: AuthTokenStore,
  opts: { readonly includeRevoked?: boolean } = {},
): Promise<ReadonlyArray<TokenMetadata>> {
  const records = await tokenStore.list();
  const includeRevoked = opts.includeRevoked ?? false;
  const filtered = includeRevoked ? records : records.filter((r) => r.revokedAt === undefined);
  return Object.freeze(filtered.map(toTokenMetadata));
}

/**
 * Soft-revoke a token. Returns the updated record or `undefined` if
 * the token is unknown. The store is responsible for setting the
 * `revokedAt` column atomically.
 *
 * @stable
 */
export async function revokeToken(
  tokenStore: AuthTokenStore,
  id: string,
  opts: {
    readonly now?: () => number;
    /**
     * SPL-9: pass the live `TokenVerifier` so revocation invalidates its
     * LRU entry immediately — without it a revoked token keeps verifying
     * from the cache for up to `cacheTtlMaxMs` (default 60s).
     */
    readonly verifier?: { invalidate(rawTokenOrHashHex: string): void };
  } = {},
): Promise<TokenMetadata | undefined> {
  const now = opts.now ?? Date.now;
  const existing = await tokenStore.get(id);
  if (existing === null) return undefined;
  if (existing.revokedAt !== undefined) return toTokenMetadata(existing);
  opts.verifier?.invalidate(existing.hashHex);
  emitAuthAudit({ action: 'token:revoke', decision: 'success', ts: now(), target: id });
  const ts = new Date(now()).toISOString();
  await tokenStore.revoke(id, ts);
  const updated = await tokenStore.get(id);
  if (updated === null) return undefined;
  return toTokenMetadata(updated);
}

/**
 * Revoke a token and immediately mint a fresh one with the same
 * scopes. Useful for grace-period rotations.
 *
 * @stable
 */
export async function rotateToken(
  options: Omit<CreateTokenOptions, 'scopes' | 'env' | 'idOverride'> & {
    readonly id: string;
    readonly env?: TokenEnvironment | string;
    readonly scopesOverride?: ReadonlyArray<string>;
    /** SPL-9: invalidates the rotated-out token's verifier cache entry. */
    readonly verifier?: { invalidate(rawTokenOrHashHex: string): void };
  },
): Promise<{ readonly old: TokenMetadata; readonly next: CreatedToken }> {
  const existing = await options.tokenStore.get(options.id);
  if (existing === null) {
    throw new Error(`rotateToken: unknown token id '${options.id}'.`);
  }
  const scopes = options.scopesOverride ?? existing.scopes;
  const env = options.env ?? inferEnvFromExisting(existing);
  await options.tokenStore.revoke(options.id, new Date((options.now ?? Date.now)()).toISOString());
  options.verifier?.invalidate(existing.hashHex);
  const next = await createToken({
    tokenStore: options.tokenStore,
    pepper: options.pepper,
    env,
    scopes,
    ...(options.label !== undefined ? { label: options.label } : {}),
    ...(options.prefix !== undefined ? { prefix: options.prefix } : {}),
    ...(options.expiresInMs !== undefined ? { expiresInMs: options.expiresInMs } : {}),
    ...(options.expiresAt !== undefined ? { expiresAt: options.expiresAt } : {}),
    ...(options.now !== undefined ? { now: options.now } : {}),
  });
  const refreshed = await options.tokenStore.get(options.id);
  emitAuthAudit({
    action: 'token:rotate',
    decision: 'success',
    ts: (options.now ?? Date.now)(),
    target: options.id,
    metadata: { newId: next.record.id },
  });
  return Object.freeze({
    old: toTokenMetadata(refreshed ?? existing),
    next,
  });
}

/**
 * Re-issue every active token. Used after a known compromise: the
 * previous tokens are revoked and replaced with fresh raw values
 * using the same scopes / labels.
 *
 * Returns the new tokens keyed by their old id so the caller can
 * route the rotated raws back to the right user.
 *
 * @stable
 */
export async function rekeyTokens(options: {
  readonly tokenStore: AuthTokenStore;
  readonly pepper: SecretValue;
  readonly env: TokenEnvironment | string;
  readonly prefix?: string;
  readonly now?: () => number;
}): Promise<ReadonlyMap<string, CreatedToken>> {
  const records = await options.tokenStore.list();
  const out = new Map<string, CreatedToken>();
  for (const record of records) {
    if (record.revokedAt !== undefined) continue;
    const next = await rotateToken({
      tokenStore: options.tokenStore,
      pepper: options.pepper,
      id: record.id,
      env: options.env,
      ...(options.prefix !== undefined ? { prefix: options.prefix } : {}),
      ...(options.now !== undefined ? { now: options.now } : {}),
    });
    out.set(record.id, next.next);
  }
  emitAuthAudit({
    action: 'token:rekey',
    decision: 'success',
    ts: (options.now ?? Date.now)(),
    target: 'all',
    metadata: { rekeyed: out.size },
  });
  return out;
}

/**
 * Generate a fresh server pepper. The result is always exactly 32
 * bytes (256 bits) so the verifier can rely on the size invariant.
 *
 * @stable
 */
export function generatePepper(): SecretValue {
  return SecretValue.fromBuffer(randomBytes(32), {
    source: { resolver: 'generatePepper', ref: 'pepper' },
  });
}

/**
 * Public-safe metadata view of a token. The HMAC hash and pepper are
 * never surfaced.
 *
 * @stable
 */
export interface TokenMetadata {
  readonly id: string;
  readonly label?: string;
  readonly scopes: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly revokedAt?: string;
  readonly lastUsedAt?: string;
}

function toTokenMetadata(record: AuthTokenRecord): TokenMetadata {
  return Object.freeze({
    id: record.id,
    ...(record.label === undefined ? {} : { label: record.label }),
    scopes: Object.freeze([...record.scopes]),
    createdAt: record.createdAt,
    ...(record.expiresAt === undefined ? {} : { expiresAt: record.expiresAt }),
    ...(record.revokedAt === undefined ? {} : { revokedAt: record.revokedAt }),
    ...(record.lastUsedAt === undefined ? {} : { lastUsedAt: record.lastUsedAt }),
  });
}

function resolveExpiresAt(options: CreateTokenOptions, now: () => number): string | undefined {
  if (options.expiresAt !== undefined) {
    if (options.expiresAt instanceof Date) return options.expiresAt.toISOString();
    return new Date(options.expiresAt).toISOString();
  }
  if (options.expiresInMs !== undefined) {
    if (!Number.isFinite(options.expiresInMs) || options.expiresInMs <= 0) {
      throw new RangeError(
        `createToken: expiresInMs must be a positive finite number; got ${options.expiresInMs}.`,
      );
    }
    return new Date(now() + options.expiresInMs).toISOString();
  }
  return undefined;
}

async function hmacHexAsync(pepper: SecretValue, raw: string): Promise<string> {
  return await pepper.useBuffer((buf) =>
    createHmac('sha256', buf).update(raw, 'utf8').digest('hex'),
  );
}

/** @internal — shared with the verifier's lazy first-use check (SPL-11). */
export async function assertPepperStrength(pepper: SecretValue): Promise<void> {
  const assessment = await pepper.useBuffer((buf) => assessSecretStrength(buf));
  if (!assessment.ok) {
    throw new WeakPepperError(assessment.byteLength, assessment.reason);
  }
}

function inferEnvFromExisting(_record: AuthTokenRecord): TokenEnvironment {
  // The contract does not currently persist the environment label
  // (it lives only in the raw token), so the helper falls back to
  // `'live'` when the caller does not supply an explicit override.
  // Phase 05 may extend the schema to persist the env label.
  return 'live';
}
