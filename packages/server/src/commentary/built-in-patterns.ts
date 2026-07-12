/**
 * Default pattern catalogue for the delivery-layer commentary-phase
 * trace sanitization applied by the WebSocket dispatcher (`@graphorin/server/ws`)
 * and the SSE event-emission boundary (`@graphorin/server/sse`).
 *
 * The catalogue DATA lives in `@graphorin/tools/outbound` as the
 * single source shared with the session-output boundary in
 * `@graphorin/sessions/commentary` and the channel delivery boundary
 * in `@graphorin/channels`. This module re-exports it under the
 * delivery-layer type: the sanitizers stay boundary-specific (wire
 * frames here, message parts in sessions), but the pattern list can
 * never drift between layers. Deployments can still override the
 * catalogue per boundary through
 * {@link import('./types.js').DeliveryCommentaryConfig}.patterns.
 *
 * @packageDocumentation
 */

import { OUTBOUND_COMMENTARY_PATTERNS } from '@graphorin/tools/outbound';
import type { DeliveryCommentaryPattern } from './types.js';

/**
 * The framework-shipped catalogue. Snapshot bytes-equal across the
 * `ws` / `sse` / `rest` transports; idempotent on a single payload
 * (the wrap envelope itself is not matched by any pattern, so a
 * second pass over a previously-sanitized payload is a no-op).
 *
 * Re-exported from the shared `@graphorin/tools/outbound` catalogue
 * (same array reference).
 *
 * @stable
 */
export const DEFAULT_DELIVERY_COMMENTARY_PATTERNS: ReadonlyArray<DeliveryCommentaryPattern> =
  OUTBOUND_COMMENTARY_PATTERNS;

/**
 * Default whitelist of `event.type` strings the dispatcher walks
 * through the sanitizer. Extension is opt-in via
 * `DeliveryCommentaryConfig.applyToEvents`.
 *
 * @stable
 */
export const DEFAULT_APPLY_TO_EVENTS: ReadonlyArray<string> = Object.freeze([
  'tool.execute.end',
  'tool.execute.error',
  'text.delta',
]);
