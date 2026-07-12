/**
 * Built-in commentary-phase trace patterns.
 *
 * The catalogue covers the seven event-shape signatures the agent
 * runtime can emit which, if leaked into a user-visible text part,
 * disclose internal tool execution detail. The catalogue DATA lives
 * in `@graphorin/tools/outbound` as the single source shared with
 * the server delivery layer and the channel gateway; this module
 * re-exports it under the session-output type so the boundary keeps
 * its own sanitizer while the pattern list can never drift between
 * layers. It is intentionally **disjoint** from the PII / secrets
 * patterns in `@graphorin/observability/redaction` and from the
 * prompt-injection imperative patterns in
 * `@graphorin/observability/redaction/imperative-patterns`. The three
 * pattern families cover non-overlapping concerns by construction so
 * no double-counting on a single content part.
 *
 * Add to the shared catalogue freely - the only requirement is that
 * the `reason` discriminator stays bounded so counter cardinality
 * stays predictable.
 *
 * @packageDocumentation
 */

import { OUTBOUND_COMMENTARY_PATTERNS } from '@graphorin/tools/outbound';
import type { CommentaryPattern } from './types.js';

/**
 * The framework-shipped catalogue. Snapshot bytes-equal across
 * boundaries; idempotent on a single content part (the wrap envelope
 * itself is not matched by any pattern).
 *
 * Re-exported from the shared `@graphorin/tools/outbound` catalogue
 * (same array reference).
 *
 * @stable
 */
export const BUILT_IN_COMMENTARY_PATTERNS: ReadonlyArray<CommentaryPattern> =
  OUTBOUND_COMMENTARY_PATTERNS;
