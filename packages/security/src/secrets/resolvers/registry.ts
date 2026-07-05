import type {
  SecretRef as SecretRefContract,
  SecretResolver,
  SecretResolverContext,
} from '@graphorin/core/contracts';

import { SecretResolutionError, UnknownSchemeError } from '../errors.js';
import { type ParsedSecretRef, parseOrAssert, parseSecretRef } from '../secret-ref.js';
import type { SecretValue } from '../secret-value.js';

/**
 * Internal registry entry - pairs the resolver with the bookkeeping
 * we need for replacement semantics and listing.
 */
type RegistryEntry = {
  readonly resolver: SecretResolver;
  readonly registeredAt: number;
  readonly source: 'builtin' | 'user';
};

const resolvers = new Map<string, RegistryEntry>();
let builtinsInstalled = false;

/**
 * Options for `registerResolver(...)`.
 *
 * @stable
 */
export interface RegisterResolverOptions {
  /** When false, throws if a resolver is already registered. Default true. */
  readonly allowReplace?: boolean;
  /** Internal flag - used by the built-in resolvers; consumers leave this off. */
  readonly source?: 'builtin' | 'user';
}

/**
 * Register a resolver for a single scheme. Last registration wins by
 * default, matching the documented "pluggable resolver" contract; pass
 * `{ allowReplace: false }` to force strict registration semantics.
 *
 * @stable
 */
export function registerResolver(
  resolver: SecretResolver,
  opts: RegisterResolverOptions = {},
): SecretResolver | undefined {
  const scheme = resolver.scheme.toLowerCase();
  if (scheme.length === 0) {
    throw new Error("registerResolver: 'scheme' must be a non-empty string.");
  }
  const allowReplace = opts.allowReplace ?? true;
  const existing = resolvers.get(scheme);
  if (existing && !allowReplace) {
    throw new Error(
      `registerResolver: scheme '${scheme}' is already registered; pass { allowReplace: true } to overwrite.`,
    );
  }
  resolvers.set(scheme, {
    resolver,
    registeredAt: Date.now(),
    source: opts.source ?? 'user',
  });
  return existing?.resolver;
}

/**
 * Look up the resolver registered for `scheme`. Returns `undefined` if
 * no resolver matches.
 *
 * @stable
 */
export function getResolver(scheme: string): SecretResolver | undefined {
  return resolvers.get(scheme.toLowerCase())?.resolver;
}

/**
 * List the schemes for which a resolver is registered. Useful for
 * `validateSecretRefs(...)` and CLI diagnostics.
 *
 * @stable
 */
export function listResolverSchemes(): ReadonlyArray<string> {
  return Object.freeze([...resolvers.keys()].sort());
}

/**
 * Remove a registered resolver. Returns `true` if a resolver was
 * removed. Tests use this to isolate fixtures.
 *
 * @stable
 */
export function unregisterResolver(scheme: string): boolean {
  return resolvers.delete(scheme.toLowerCase());
}

/**
 * Reset the registry to a freshly-installed built-in state. Tests use
 * this between cases.
 *
 * @experimental
 */
export function _resetResolversForTesting(): void {
  resolvers.clear();
  builtinsInstalled = false;
}

/**
 * Internal hook used by `installBuiltinResolvers(...)` to track that
 * the built-ins have been installed once. Repeat calls are no-ops.
 *
 * @internal
 */
export function _markBuiltinsInstalled(): void {
  builtinsInstalled = true;
}

/**
 * Whether the built-in resolver set has been installed in the current
 * registry. The factory and `validateSecretRefs(...)` use this to
 * surface the "did you forget to import @graphorin/security?" failure
 * early.
 *
 * @internal
 */
export function areBuiltinsInstalled(): boolean {
  return builtinsInstalled;
}

/**
 * Resolve a `SecretRef` (string or parsed) into a `SecretValue` via
 * the active resolver. Throws `UnknownSchemeError` if no resolver
 * matches; rewraps non-typed errors thrown by the resolver into a
 * `SecretResolutionError` so consumers always see a stable error
 * surface.
 *
 * @stable
 */
export async function resolveSecret(
  ref: string | ParsedSecretRef | SecretRefContract,
  ctx?: SecretResolverContext,
): Promise<SecretValue> {
  const parsed = typeof ref === 'string' ? parseOrAssert(ref) : (ref as ParsedSecretRef);
  const entry = resolvers.get(parsed.scheme.toLowerCase());
  if (!entry) {
    throw new UnknownSchemeError(parsed.scheme, parsed.raw);
  }
  try {
    return (await entry.resolver.resolve(parsed, ctx)) as SecretValue;
  } catch (err) {
    if (err instanceof UnknownSchemeError || err instanceof SecretResolutionError) throw err;
    if (err instanceof Error) throw err;
    throw new SecretResolutionError(parsed.scheme, parsed.raw, String(err), { cause: err });
  }
}

/**
 * Optional helper consumed by `validateSecretRefs(...)` - re-parses an
 * already-validated `SecretRef`. Kept here so the registry can be the
 * single import surface for downstream wiring.
 *
 * @stable
 */
export function reparse(ref: string): ParsedSecretRef {
  return parseSecretRef(ref);
}
