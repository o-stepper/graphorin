/**
 * Default pattern catalogue for the delivery-layer commentary-phase
 * trace sanitization applied by the WebSocket dispatcher (`@graphorin/server/ws`)
 * and the SSE event-emission boundary (`@graphorin/server/sse`).
 *
 * The catalogue is structurally identical to the session-output
 * sanitization catalogue exposed by `@graphorin/sessions/commentary`;
 * they live in two packages so the server's delivery layer does not
 * pull a hard dependency on the session module while still providing
 * defense-in-depth across the storage-write boundary (Phase 11) and
 * the wire-emission boundary (this module). Deployments that want a
 * single source of truth across both layers can pass the sessions
 * catalogue through {@link import('./types.js').DeliveryCommentaryConfig}.patterns.
 *
 * @packageDocumentation
 */

import type { DeliveryCommentaryPattern } from './types.js';

/**
 * The framework-shipped catalogue. Snapshot bytes-equal across the
 * `ws` / `sse` / `rest` transports; idempotent on a single payload
 * (the wrap envelope itself is not matched by any pattern, so a
 * second pass over a previously-sanitized payload is a no-op).
 *
 * @stable
 */
export const DEFAULT_DELIVERY_COMMENTARY_PATTERNS: ReadonlyArray<DeliveryCommentaryPattern> =
  Object.freeze([
    Object.freeze({
      reason: 'tool.call.start-payload-signature',
      regex: /\{\s*"type"\s*:\s*"tool\.call\.start"[\s\S]*?"toolName"\s*:\s*"[^"]+"[\s\S]*?\}/g,
      description:
        'JSON-encoded `tool.call.start` event with a `toolName` field - leaks the internal tool dispatch.',
    }),
    Object.freeze({
      reason: 'tool.call.delta-payload-signature',
      regex: /\{\s*"type"\s*:\s*"tool\.call\.delta"[\s\S]*?"argsDelta"[\s\S]*?\}/g,
      description: 'JSON-encoded `tool.call.delta` event with streaming `argsDelta`.',
    }),
    Object.freeze({
      reason: 'tool.call.end-payload-signature',
      regex: /\{\s*"type"\s*:\s*"tool\.call\.end"[\s\S]*?"finalArgs"[\s\S]*?\}/g,
      description: 'JSON-encoded `tool.call.end` event carrying the final args payload.',
    }),
    Object.freeze({
      reason: 'tool.execute.end-payload-signature',
      regex: /\{\s*"type"\s*:\s*"tool\.execute\.end"[\s\S]*?"result"\s*:\s*[\s\S]*?\}/g,
      description: 'JSON-encoded `tool.execute.end` event with the raw `result` payload.',
    }),
    Object.freeze({
      reason: 'agent.fanout-event-signature',
      regex: /\{\s*"type"\s*:\s*"agent\.fanout\.(?:spawned|merged)"[\s\S]*?\}/g,
      description: 'JSON-encoded `agent.fanout.spawned` / `agent.fanout.merged` event.',
    }),
    Object.freeze({
      reason: 'context.compacted-event-signature',
      regex: /\{\s*"type"\s*:\s*"context\.compacted"[\s\S]*?"originalTokens"[\s\S]*?\}/g,
      description: 'JSON-encoded `context.compacted` event with token deltas.',
    }),
    Object.freeze({
      reason: 'agent.model.fellback-event-signature',
      regex: /\{\s*"type"\s*:\s*"agent\.model\.fellback"[\s\S]*?"fromModel"[\s\S]*?\}/g,
      description: 'JSON-encoded `agent.model.fellback` event with fallback chain detail.',
    }),
  ]);

/**
 * Default whitelist of `event.type` strings the dispatcher walks
 * through the sanitizer. Extension is opt-in via
 * {@link import('./types.js').DeliveryCommentaryConfig}.applyToEvents.
 *
 * @stable
 */
export const DEFAULT_APPLY_TO_EVENTS: ReadonlyArray<string> = Object.freeze([
  'tool.execute.end',
  'tool.execute.error',
  'text.delta',
]);
