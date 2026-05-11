/**
 * Sensitivity tier for any piece of data flowing through Graphorin.
 *
 * - `'public'`   — non-sensitive content; safe for any provider, any sink.
 * - `'internal'` — default for user-generated content; safe for trusted
 *   providers (loopback / private-network) but redacted for public-tls
 *   exporters and replay consumers.
 * - `'secret'`   — credentials, tokens, encryption keys; only ever stays
 *   in-process and is never serialized to the wire by default.
 *
 * @stable
 */
export type Sensitivity = 'public' | 'internal' | 'secret';

/**
 * Strict ordering used by sensitivity-aware filters
 * (`record.sensitivity ⊆ provider.acceptsSensitivity`).
 *
 * @stable
 */
export const SENSITIVITY_ORDER: readonly Sensitivity[] = ['public', 'internal', 'secret'] as const;

/**
 * Return `true` iff `record` is allowed to flow to a sink declaring `accepts`.
 *
 * Comparison is **subset** semantics: the record's tier must be one of the
 * tiers in `accepts` (it's not enough for the record's tier to be lower).
 * That mirrors the way provider `acceptsSensitivity` is declared in the
 * Graphorin trust matrix.
 *
 * @stable
 */
export function acceptsSensitivity(accepts: readonly Sensitivity[], record: Sensitivity): boolean {
  return accepts.includes(record);
}
