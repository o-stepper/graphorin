/**
 * @graphorin/secret-1password - reference 1Password secret-resolver
 * adapter for the Graphorin framework.
 *
 * Registers the `op://` scheme on top of `@graphorin/security`'s
 * pluggable `SecretResolver` registry by shelling out to the official
 * 1Password CLI:
 *
 * ```ts
 * import { registerResolver } from '@graphorin/security';
 * import { onePasswordResolver } from '@graphorin/secret-1password';
 *
 * registerResolver(onePasswordResolver);
 *
 * // Anywhere downstream:
 * const apiKey = await resolveSecret('op://Personal/OpenAI/api-key');
 * ```
 *
 * The adapter is also the canonical template community packages
 * should follow when wiring HashiCorp Vault, AWS Secrets Manager, GCP
 * Secret Manager, Azure Key Vault, Bitwarden, or Unix `pass` as
 * additional `SecretResolver` implementations.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.6.0';

export {
  createDefaultOpCli,
  createOpCli,
  type OpCli,
  OpCliError,
  type OpCliErrorKind,
  type OpCliReadOptions,
  type OpCliReadResult,
} from './op-cli.js';
export {
  createOnePasswordResolver,
  normalizeOpUri,
  type OnePasswordResolverOptions,
  onePasswordResolver,
} from './resolver.js';
