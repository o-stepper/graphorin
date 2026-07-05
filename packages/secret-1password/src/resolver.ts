/**
 * `op://`-scheme `SecretResolver` for the Graphorin framework. Wraps
 * the official 1Password CLI (`op`) per the canonical `op read` flow
 * documented at https://developer.1password.com/docs/cli/secrets-references/.
 *
 * URI shape (per 1Password): `op://<vault>/<item>/[section/]<field>`.
 * The resolver accepts any `op://` URI the CLI accepts (the CLI is
 * the source of truth - we forward verbatim) and rejects only the
 * obvious malformed cases at parse time.
 *
 * 1Password explicitly treats vault / item / field names as
 * case-insensitive; the resolver normalises the URI by lowercasing the
 * authority + path before forwarding to the CLI so two configs that
 * differ only in case resolve to the same value.
 *
 * @packageDocumentation
 */

import type { SecretResolver, SecretResolverContext } from '@graphorin/core/contracts';
import { type ParsedSecretRef, SecretResolutionError, SecretValue } from '@graphorin/security';

import { createDefaultOpCli, type OpCli, OpCliError } from './op-cli.js';

/** @stable */
export interface OnePasswordResolverOptions {
  /**
   * Inject a {@link OpCli} implementation. Defaults to a wrapper that
   * spawns the system `op` binary. Tests pass a stub.
   */
  readonly cli?: OpCli;
  /** Override the CLI binary path. Default `'op'`. */
  readonly binary?: string;
  /** Hard timeout per resolve. Default `15000` ms. */
  readonly timeoutMs?: number;
  /**
   * Optional service-account token. When set the resolver forwards it
   * via `OP_SERVICE_ACCOUNT_TOKEN` so the CLI runs in headless mode.
   * The token is itself a secret - pass a previously-resolved
   * `SecretValue` and use `.use(...)` to scope its lifetime.
   */
  readonly serviceAccountToken?: string;
  /**
   * Optional 1Password Connect host + token. Mutually exclusive with
   * a service-account token at the CLI level (the CLI honours the
   * Connect env vars if both are present).
   */
  readonly connect?: { readonly host: string; readonly token: string };
  /**
   * Optional `--account` override. Useful when the operator is signed
   * in to multiple 1Password accounts.
   */
  readonly account?: string;
  /**
   * If `true`, do **not** lowercase the URI before forwarding to the
   * CLI. Default `false`. Toggle only when interoperating with a
   * deployment that intentionally relies on case-sensitive keys.
   */
  readonly preserveCase?: boolean;
}

/**
 * Build a `SecretResolver` that honours the `op://` scheme. Register
 * with `registerResolver(...)` from `@graphorin/security` at app
 * bootstrap.
 *
 * @stable
 */
export function createOnePasswordResolver(
  options: OnePasswordResolverOptions = {},
): SecretResolver {
  const cli = options.cli ?? createDefaultOpCli();
  return {
    scheme: 'op',
    async resolve(ref, ctx?: SecretResolverContext): Promise<SecretValue> {
      void ctx;
      const parsed = ref as ParsedSecretRef;
      assertOpRef(parsed);
      const normalized = options.preserveCase === true ? parsed.raw : normalizeOpUri(parsed.raw);
      try {
        const result = await cli.read(normalized, {
          ...(options.binary !== undefined ? { binary: options.binary } : {}),
          ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
          ...(options.serviceAccountToken !== undefined
            ? { serviceAccountToken: options.serviceAccountToken }
            : {}),
          ...(options.connect !== undefined ? { connect: options.connect } : {}),
          ...(options.account !== undefined ? { account: options.account } : {}),
        });
        if (result.value.length === 0) {
          throw new SecretResolutionError(
            'op',
            parsed.raw,
            '1Password CLI returned an empty value; verify the field exists and is non-empty.',
          );
        }
        return SecretValue.fromString(result.value, {
          source: { resolver: 'op', ref: parsed.raw },
        });
      } catch (err) {
        if (err instanceof OpCliError) {
          throw new SecretResolutionError(
            'op',
            parsed.raw,
            `${err.message}${err.hint !== undefined ? ` - hint: ${err.hint}` : ''}`,
            { cause: err },
          );
        }
        throw err;
      }
    },
  };
}

/**
 * Cache the default-options resolver so callers that just want the
 * happy-path behaviour can use a constant export.
 *
 * @stable
 */
export const onePasswordResolver: SecretResolver = createOnePasswordResolver();

function assertOpRef(parsed: ParsedSecretRef): void {
  if (parsed.scheme !== 'op') {
    throw new SecretResolutionError(
      'op',
      parsed.raw,
      `expected scheme 'op', received '${parsed.scheme}'.`,
    );
  }
  if (parsed.authority === undefined || parsed.authority.length === 0) {
    throw new SecretResolutionError(
      'op',
      parsed.raw,
      "op:// SecretRef must include a vault authority (e.g. 'op://Personal/Item/field').",
    );
  }
  if (parsed.path === undefined || parsed.path.length <= 1) {
    throw new SecretResolutionError(
      'op',
      parsed.raw,
      "op:// SecretRef must include an item + field path segment (e.g. 'op://Vault/Item/field').",
    );
  }
  const segments = parsed.path.split('/').filter((s) => s.length > 0);
  if (segments.length < 2) {
    throw new SecretResolutionError(
      'op',
      parsed.raw,
      'op:// SecretRef must reference at least an item + field (got ' +
        `${segments.length} path segment(s) after the vault).`,
    );
  }
}

/**
 * Lowercase the authority + path segments of an `op://` URI so two
 * configs that differ only in case resolve to the same value (matching
 * 1Password's case-insensitive behaviour).
 *
 * Exposed for tests.
 *
 * @stable
 */
export function normalizeOpUri(raw: string): string {
  // Lowercase only the part up to the first `?` or `#` so query /
  // fragment components keep their original case (the CLI does not
  // currently use them, but forward-compat matters).
  const queryIdx = raw.indexOf('?');
  const fragIdx = raw.indexOf('#');
  const cuts = [queryIdx, fragIdx].filter((i) => i >= 0);
  const split = cuts.length > 0 ? Math.min(...cuts) : raw.length;
  const head = raw.slice(0, split).toLowerCase();
  const tail = raw.slice(split);
  return head + tail;
}
