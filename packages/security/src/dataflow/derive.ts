/**
 * Derive a {@link TaintLabel} from a tool's registration metadata.
 *
 * @packageDocumentation
 */

import type { Sensitivity, ToolSource, ToolTrustClass } from '@graphorin/core';
import type { TaintLabel } from './types.js';

/**
 * Trust classes whose output is treated as untrusted — content a prompt
 * injection could be hidden in. Mirrors the plan's P1-3 taint sources.
 */
const UNTRUSTED_TRUST_CLASSES: ReadonlySet<ToolTrustClass> = new Set<ToolTrustClass>([
  'mcp-derived',
  'web-search',
  'skill-untrusted',
]);

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
}): TaintLabel {
  return {
    trustClass: input.trustClass,
    sourceKind: input.source?.kind ?? 'unknown',
    sensitivity: input.sensitivity ?? 'unknown',
    untrusted: UNTRUSTED_TRUST_CLASSES.has(input.trustClass),
    sensitive: input.sensitivity === 'secret',
  };
}
