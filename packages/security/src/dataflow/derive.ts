/**
 * Derive a {@link TaintLabel} from a tool's registration metadata.
 *
 * @packageDocumentation
 */

import type { Sensitivity, ToolSource, ToolTrustClass } from '@graphorin/core';
import type { TaintLabel } from './types.js';

/**
 * Trust classes whose output is treated as untrusted - content a prompt
 * injection could be hidden in.
 */
const UNTRUSTED_TRUST_CLASSES: ReadonlySet<ToolTrustClass> = new Set<ToolTrustClass>([
  'mcp-derived',
  'web-search',
  'skill-untrusted',
  // Message-borne input from a messenger channel (B1.5). Channel peers
  // are authenticated by the pairing policy but their CONTENT is still
  // attacker-influenceable (forwarded text, quoted articles), so both
  // the taint engine and the Rule-of-Two untrustedInput leg treat it
  // as untrusted.
  'channel-inbound',
]);

/**
 * Whether a tool trust class is an UNTRUSTED-content source.
 * The single definition shared by the taint engine
 * ({@link deriveTaintLabel}) and the Rule-of-Two `untrustedInput` leg -
 * the two layers must never disagree about what "untrusted" means.
 *
 * @stable
 */
export function isUntrustedTrustClass(trustClass: ToolTrustClass): boolean {
  return UNTRUSTED_TRUST_CLASSES.has(trustClass);
}

/**
 * Derive the provenance label for a tool's output from its resolved
 * trust class, source, and declared sensitivity.
 *
 * - `untrusted` is keyed off the {@link ToolTrustClass}: `mcp-derived`,
 *   `web-search`, and `skill-untrusted` produce untrusted output.
 * - `sensitive` is `true` only for the `'secret'` tier. `'internal'` is
 *   the default tier for ordinary user content, so counting it would make
 *   the lethal-trifecta gate fire on essentially every run; operators who
 *   want a broader gate widen it via policy, not here.
 *
 * @stable
 */
export function deriveTaintLabel(input: {
  readonly trustClass: ToolTrustClass;
  readonly source?: ToolSource;
  readonly sensitivity?: Sensitivity;
  /**
   * Sensitivity tiers that count as "sensitive" for the lethal-trifecta
   * leg. Default `['secret']` - out of the box only secret-tagged
   * content arms the trifecta, so the gate does not fire on every run.
   * Widen to e.g. `['secret', 'internal']` to also treat ordinary
   * user/PII content (which defaults to `'internal'`) as sensitive.
   */
  readonly sensitiveTiers?: ReadonlyArray<Sensitivity>;
}): TaintLabel {
  const sensitiveTiers = input.sensitiveTiers ?? (['secret'] as const);
  return {
    trustClass: input.trustClass,
    sourceKind: input.source?.kind ?? 'unknown',
    sensitivity: input.sensitivity ?? 'unknown',
    untrusted: UNTRUSTED_TRUST_CLASSES.has(input.trustClass),
    sensitive: input.sensitivity !== undefined && sensitiveTiers.includes(input.sensitivity),
  };
}
