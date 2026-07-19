/**
 * Sensitivity-tier filter. Tags every memory record with a
 * decision (`'pass'` / `'drop'`) before the assembled prompt is
 * compiled. The filter is *tier-based* - it trusts the
 * `record.sensitivity` tag the consolidator / writer set; the
 * outbound prompt-redaction middleware (ADR-045) is the
 * universal backstop for content the filter cannot see (raw user
 * input, tool results, MCP responses, skill bodies, agent
 * instructions, tool-call args).
 *
 * @packageDocumentation
 */

import type { LocalProviderTrust, Sensitivity } from '@graphorin/core';

/**
 * Filter input: the record-level sensitivity tag + the per-tier
 * trust class of the active provider.
 *
 * @stable
 */
export interface PrivacyFilterContext {
  /**
   * Sensitivity tiers the active provider is allowed to receive.
   * When omitted, the per-tier defaults below apply.
   */
  readonly providerAcceptsSensitivity?: ReadonlyArray<Sensitivity>;
  /**
   * Trust class of the active provider as classified by
   * `@graphorin/provider/trust/classify-local-provider.ts`. Defaults
   * to `'public-tls'` (the conservative cloud default).
   */
  readonly providerTrust?: LocalProviderTrust;
  /**
   * Per-user opt-in for cloud upload of `'internal'`-tier content.
   * Default `false` - `'internal'` content does not leave the
   * loopback boundary unless the user explicitly opts in.
   */
  readonly cloudUploadConsent?: boolean;
  /**
   * Override the default sensitivity applied to records that are
   * missing a tag. Default `'internal'` per DEC-126.
   */
  readonly defaultSensitivity?: Sensitivity;
}

/**
 * Output of {@link decide} for a single record.
 *
 * @stable
 */
export type PrivacyDecision = 'pass' | 'drop';

/**
 * Reason the decision was made. Surfaced to the metadata block so
 * operators can audit per-tier drops.
 *
 * @stable
 */
export type PrivacyDecisionReason =
  | 'provider-rejects-secret'
  | 'provider-rejects-internal'
  | 'no-cloud-upload-consent'
  | 'allowed';

/**
 * Resolve the effective `acceptsSensitivity` set for a provider.
 * The function is pure: callers can supply a custom matrix to
 * override the defaults (used by tests + custom adapters).
 *
 * Defaults (DEC-149, ADR-013 ext):
 *
 * - `'loopback'`  → `['public', 'internal', 'secret']`.
 * - `'private'`   → `['public', 'internal']`.
 * - `'public-tls'` / `'public-cleartext'` → `['public']`.
 *
 * Per-provider overrides always win over the defaults - pass
 * `providerAcceptsSensitivity` explicitly to override.
 *
 * @stable
 */
export function effectiveAcceptsSensitivity(
  context: PrivacyFilterContext,
): ReadonlyArray<Sensitivity> {
  if (context.providerAcceptsSensitivity !== undefined) {
    return context.providerAcceptsSensitivity;
  }
  switch (context.providerTrust ?? 'public-tls') {
    case 'loopback':
      return ['public', 'internal', 'secret'];
    case 'private':
      return ['public', 'internal'];
    case 'public-tls':
    case 'public-cleartext':
      return ['public'];
    default:
      return ['public'];
  }
}

/**
 * Decide whether a single record is safe to send to the active
 * provider. The decision logic mirrors the DoD spec:
 *
 * - `'public'` always passes.
 * - `'secret'` passes only when the provider explicitly accepts
 *   `'secret'` AND the trust class is `'loopback'`.
 * - `'internal'` passes when the provider accepts `'internal'`
 *   AND `cloudUploadConsent === true` (or the trust class is
 *   `'loopback'` / `'private'`).
 *
 * @stable
 */
export function decide(
  recordSensitivity: Sensitivity | undefined,
  context: PrivacyFilterContext,
): { readonly decision: PrivacyDecision; readonly reason: PrivacyDecisionReason } {
  const sensitivity = recordSensitivity ?? context.defaultSensitivity ?? 'internal';
  const accepts = effectiveAcceptsSensitivity(context);
  const trust = context.providerTrust ?? 'public-tls';
  if (sensitivity === 'public') {
    return { decision: 'pass', reason: 'allowed' };
  }
  if (sensitivity === 'secret') {
    if (accepts.includes('secret') && trust === 'loopback') {
      return { decision: 'pass', reason: 'allowed' };
    }
    return { decision: 'drop', reason: 'provider-rejects-secret' };
  }
  // 'internal'
  if (!accepts.includes('internal')) {
    return { decision: 'drop', reason: 'provider-rejects-internal' };
  }
  if (trust === 'loopback' || trust === 'private') {
    return { decision: 'pass', reason: 'allowed' };
  }
  if (context.cloudUploadConsent === true) {
    return { decision: 'pass', reason: 'allowed' };
  }
  return { decision: 'drop', reason: 'no-cloud-upload-consent' };
}

/**
 * Bookkeeping returned by {@link partition}. Carries both the
 * surviving + dropped records and a per-reason counter for the
 * audit trail.
 *
 * @stable
 */
export interface PartitionResult<TRecord> {
  readonly kept: ReadonlyArray<TRecord>;
  readonly dropped: ReadonlyArray<{
    readonly record: TRecord;
    readonly reason: PrivacyDecisionReason;
  }>;
  readonly counters: Readonly<Record<PrivacyDecisionReason, number>>;
}

/**
 * Partition a record list against the supplied filter context.
 *
 * @stable
 */
export function partition<TRecord extends { readonly sensitivity?: Sensitivity }>(
  records: ReadonlyArray<TRecord>,
  context: PrivacyFilterContext,
): PartitionResult<TRecord> {
  const kept: TRecord[] = [];
  const dropped: Array<{ readonly record: TRecord; readonly reason: PrivacyDecisionReason }> = [];
  const counters: Record<PrivacyDecisionReason, number> = {
    allowed: 0,
    'no-cloud-upload-consent': 0,
    'provider-rejects-internal': 0,
    'provider-rejects-secret': 0,
  };
  for (const record of records) {
    const outcome = decide(record.sensitivity, context);
    counters[outcome.reason] += 1;
    if (outcome.decision === 'pass') {
      kept.push(record);
    } else {
      dropped.push({ record, reason: outcome.reason });
    }
  }
  return Object.freeze({
    kept: Object.freeze(kept),
    dropped: Object.freeze(dropped),
    counters: Object.freeze(counters),
  });
}
