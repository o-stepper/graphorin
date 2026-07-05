/**
 * `graphorin token` - manage server auth tokens.
 *
 * The subcommand thin-wraps the library functions in
 * `@graphorin/security/auth` (`createToken`, `listTokens`,
 * `revokeToken`, `rotateToken`, `rekeyTokens`, `verifyOffline`). Per
 * Phase 15 § Tokens the surface ships:
 *
 *  - `graphorin token create --label <name> --scopes <list> [--expires-in <duration>]`
 *  - `graphorin token list`
 *  - `graphorin token revoke <id>`
 *  - `graphorin token rotate <id>`
 *  - `graphorin token rekey`
 *  - `graphorin token verify <token>`
 *
 * The raw token bytes are shown to the operator at most once - at the
 * call site of `create` / `rotate` / `rekey`. They are wrapped in a
 * {@link SecretValue} on the way back to keep accidental logging out
 * of the codepath; the CLI prints them via `value.use((s) => ...)` so
 * the bytes never live as a plain string variable longer than needed.
 *
 * @packageDocumentation
 */

import {
  createToken,
  listTokens,
  rekeyTokens,
  revokeToken,
  rotateToken,
  type TokenMetadata,
  verifyOffline,
} from '@graphorin/security';

import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';
import { openStoreContext } from '../internal/store-context.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** @stable */
export interface TokenCommonOptions extends CommonOutputOptions {
  readonly config?: string;
}

/** @stable */
export interface TokenCreateOptions extends TokenCommonOptions {
  readonly label?: string;
  /** Comma-separated scope list. */
  readonly scopes: ReadonlyArray<string>;
  /** Duration string: `30d`, `12h`, `90m`, `45s`. */
  readonly expiresIn?: string;
  readonly env?: 'live' | 'test';
}

/** @stable */
export interface TokenCreateResult {
  readonly id: string;
  readonly label?: string;
  readonly scopes: ReadonlyArray<string>;
  readonly raw: string;
  readonly expiresAt?: string;
}

/**
 * Create a token. Returns the raw value once + the persisted record.
 *
 * @stable
 */
export async function runTokenCreate(options: TokenCreateOptions): Promise<TokenCreateResult> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
    requirePepper: true,
  });
  try {
    if (ctx.pepper === undefined) {
      throw new Error(
        '[graphorin/cli] internal: pepper resolution should have populated ctx.pepper',
      );
    }
    const env = options.env ?? 'live';
    const expiresInMs =
      options.expiresIn !== undefined ? parseDuration(options.expiresIn) : undefined;
    const created = await createToken({
      tokenStore: ctx.store.authTokens,
      pepper: ctx.pepper,
      env,
      scopes: options.scopes,
      ...(options.label !== undefined ? { label: options.label } : {}),
      ...(expiresInMs !== undefined ? { expiresInMs } : {}),
    });
    const raw = await created.raw.use((s) => String(s));
    const out: TokenCreateResult = Object.freeze({
      id: created.record.id,
      ...(created.record.label !== undefined ? { label: created.record.label } : {}),
      scopes: Object.freeze([...created.record.scopes]),
      raw,
      ...(created.record.expiresAt !== undefined ? { expiresAt: created.record.expiresAt } : {}),
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`token created (id=${out.id}, scopes=${out.scopes.join(',')})`));
      print(brand(`raw token (shown ONCE):`));
      print(`  ${out.raw}`);
      if (out.expiresAt !== undefined) {
        print(brand(`expires at: ${out.expiresAt}`));
      }
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface TokenListOptions extends TokenCommonOptions {
  readonly includeRevoked?: boolean;
}

/**
 * List token metadata.
 *
 * @stable
 */
export async function runTokenList(
  options: TokenListOptions = {},
): Promise<ReadonlyArray<TokenMetadata>> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const list = await listTokens(ctx.store.authTokens, {
      includeRevoked: options.includeRevoked === true,
    });
    emitReport(options, list, () => {
      const print = options.print ?? defaultPrintSink;
      if (list.length === 0) {
        print(brand('no tokens registered.'));
        return;
      }
      print(brand(`${list.length} token(s):`));
      for (const t of list) {
        const status = t.revokedAt !== undefined ? statusMarker('warn') : statusMarker('ok');
        print(`  ${status} ${t.id} (label=${t.label ?? '-'}, scopes=${t.scopes.join(',')})`);
      }
    });
    return list;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface TokenRevokeOptions extends TokenCommonOptions {
  readonly id: string;
}

/**
 * Revoke a single token.
 *
 * @stable
 */
export async function runTokenRevoke(
  options: TokenRevokeOptions,
): Promise<TokenMetadata | undefined> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
  });
  try {
    const result = await revokeToken(ctx.store.authTokens, options.id);
    emitReport(options, result ?? null, () => {
      const print = options.print ?? defaultPrintSink;
      if (result === undefined) {
        print(brand(`token '${options.id}' not found.`));
        process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
        return;
      }
      print(brand(`token '${result.id}' revoked at ${result.revokedAt ?? '<now>'}`));
    });
    return result;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface TokenRotateOptions extends TokenCommonOptions {
  readonly id: string;
  readonly env?: 'live' | 'test';
}

/**
 * Revoke an existing token and immediately mint a fresh one with the
 * same scopes. Returns the new raw token bytes once.
 *
 * @stable
 */
export async function runTokenRotate(options: TokenRotateOptions): Promise<TokenCreateResult> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
    requirePepper: true,
  });
  try {
    if (ctx.pepper === undefined) {
      throw new Error('[graphorin/cli] internal: pepper missing.');
    }
    const env = options.env ?? 'live';
    const result = await rotateToken({
      tokenStore: ctx.store.authTokens,
      pepper: ctx.pepper,
      id: options.id,
      env,
    });
    const raw = await result.next.raw.use((s) => String(s));
    const out: TokenCreateResult = Object.freeze({
      id: result.next.record.id,
      ...(result.next.record.label !== undefined ? { label: result.next.record.label } : {}),
      scopes: Object.freeze([...result.next.record.scopes]),
      raw,
      ...(result.next.record.expiresAt !== undefined
        ? { expiresAt: result.next.record.expiresAt }
        : {}),
    });
    emitReport(options, out, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`token '${result.old.id}' revoked + replaced by '${out.id}'`));
      print(brand('raw token (shown ONCE):'));
      print(`  ${raw}`);
    });
    return out;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface TokenRekeyOptions extends TokenCommonOptions {
  readonly env?: 'live' | 'test';
}

/**
 * Re-issue every active token. Used after a known compromise.
 *
 * @stable
 */
export async function runTokenRekey(
  options: TokenRekeyOptions = {},
): Promise<
  ReadonlyArray<{ readonly oldId: string; readonly newId: string; readonly raw: string }>
> {
  const ctx = await openStoreContext({
    ...(options.config !== undefined ? { config: options.config } : {}),
    requirePepper: true,
  });
  try {
    if (ctx.pepper === undefined) {
      throw new Error('[graphorin/cli] internal: pepper missing.');
    }
    const result = await rekeyTokens({
      tokenStore: ctx.store.authTokens,
      pepper: ctx.pepper,
      env: options.env ?? 'live',
    });
    const out: Array<{ readonly oldId: string; readonly newId: string; readonly raw: string }> = [];
    for (const [oldId, created] of result) {
      const raw = await created.raw.use((s) => String(s));
      out.push(Object.freeze({ oldId, newId: created.record.id, raw }));
    }
    const frozen = Object.freeze(out);
    emitReport(options, frozen, () => {
      const print = options.print ?? defaultPrintSink;
      print(brand(`rekeyed ${frozen.length} token(s):`));
      for (const row of frozen) {
        print(`  - old=${row.oldId} new=${row.newId}`);
        print(`    raw: ${row.raw}`);
      }
    });
    return frozen;
  } finally {
    await ctx.close();
  }
}

/** @stable */
export interface TokenVerifyOptions extends CommonOutputOptions {
  readonly token: string;
  /** Optional override of the expected token prefix. */
  readonly prefix?: string;
}

/** @stable */
export interface TokenVerifyResult {
  readonly ok: boolean;
  readonly reason?: string;
}

/**
 * Offline checksum verification. Confirms the structural shape, the
 * environment marker, and the CRC checksum but does NOT consult the
 * token store - it only proves the token was minted by a Graphorin
 * helper.
 *
 * @stable
 */
export function runTokenVerify(options: TokenVerifyOptions): TokenVerifyResult {
  const result = verifyOffline(options.token, {
    ...(options.prefix !== undefined ? { acceptPrefix: options.prefix } : {}),
  });
  const out: TokenVerifyResult = Object.freeze({
    ok: result.ok,
    ...(result.ok ? {} : { reason: result.reason }),
  });
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    if (out.ok) {
      print(brand(`token format ${statusMarker('ok')} (offline checksum verified)`));
      return;
    }
    print(brand(`token format ${statusMarker('fail')} (${out.reason ?? 'unknown reason'})`));
    process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
  });
  return out;
}

/**
 * Tiny duration parser. Accepts `Ns`, `Nm`, `Nh`, `Nd`. Returns
 * milliseconds. Throws on invalid input - surfaced as a fail-fast at
 * the CLI boundary.
 *
 * @internal
 */
export function parseDuration(input: string): number {
  const match = /^(\d+)\s*([smhd])$/i.exec(input.trim());
  if (!match) {
    throw new Error(
      `[graphorin/cli] invalid --expires-in '${input}'. Use the form '<number><s|m|h|d>' (e.g. 30d).`,
    );
  }
  const value = Number.parseInt(match[1] as string, 10);
  const unit = (match[2] as string).toLowerCase();
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60_000;
    case 'h':
      return value * 60 * 60_000;
    case 'd':
      return value * ONE_DAY_MS;
    default:
      throw new Error(`[graphorin/cli] invalid --expires-in unit '${unit}'.`);
  }
}
