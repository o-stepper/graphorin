/**
 * Single-source outbound commentary pattern catalogue + envelope
 * helpers, shared by every outbound sanitization boundary:
 *
 *  - the `@graphorin/server` delivery layer (WS / SSE wire frames),
 *  - the `@graphorin/sessions` session-output boundary (`Message`
 *    content parts),
 *  - the `@graphorin/channels` gateway (`deliver()` payloads).
 *
 * The sanitizers themselves stay boundary-specific by design: wire
 * frames, message parts and delivery payloads need different walkers
 * and different audit shapes. What is shared is the DATA - the seven
 * pattern signatures plus the wrap-envelope helpers - so the
 * catalogue can never drift between layers again and a new outbound
 * surface (a messenger channel, an export format) starts from the
 * full set instead of a partial copy.
 *
 * The catalogue is intentionally **disjoint** from the PII / secrets
 * patterns in `@graphorin/observability/redaction` and from the
 * prompt-injection imperative patterns; the three pattern families
 * cover non-overlapping concerns by construction.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';

/**
 * Operator-facing policy shared by all outbound commentary
 * sanitizers.
 *
 *  - `'wrap'` (default) - wraps the matched fragment in a
 *    `<<<commentary>>>...<<</commentary>>>` envelope so downstream
 *    consumers can choose to render or hide based on context.
 *  - `'strip'` - removes the matched fragment entirely.
 *  - `'pass-through'` - disables the sanitization (operator opt-in
 *    for trusted deployments).
 *
 * @stable
 */
export type OutboundCommentaryPolicy = 'wrap' | 'strip' | 'pass-through';

/**
 * Stable label for each detection pattern. Surfaced in audit rows;
 * the counter label cardinality is bounded.
 *
 * @stable
 */
export type OutboundCommentaryReason =
  | 'tool.call.start-payload-signature'
  | 'tool.call.delta-payload-signature'
  | 'tool.call.end-payload-signature'
  | 'tool.execute.end-payload-signature'
  | 'agent.fanout-event-signature'
  | 'context.compacted-event-signature'
  | 'agent.model.fellback-event-signature';

/**
 * Single pattern entry in the {@link OUTBOUND_COMMENTARY_PATTERNS}
 * catalogue.
 *
 * @stable
 */
export interface OutboundCommentaryPattern {
  readonly reason: OutboundCommentaryReason;
  readonly regex: RegExp;
  readonly description: string;
}

/**
 * Default wrap-envelope open delimiter shared by all outbound
 * sanitizers, so a fragment wrapped at one boundary is recognized
 * (and never re-wrapped) at every other boundary.
 *
 * @stable
 */
export const COMMENTARY_WRAP_OPEN = '<<<commentary>>>';

/**
 * Default wrap-envelope close delimiter. See
 * {@link COMMENTARY_WRAP_OPEN}.
 *
 * @stable
 */
export const COMMENTARY_WRAP_CLOSE = '<<</commentary>>>';

/**
 * The framework-shipped catalogue: the seven event-shape signatures
 * the agent runtime can emit which, if leaked into user-visible
 * text, disclose internal tool execution detail. Bytes-equal across
 * every boundary that consumes it; idempotent on a single payload
 * (the wrap envelope itself is not matched by any pattern, so a
 * second pass over previously-sanitized output is a no-op).
 *
 * @stable
 */
export const OUTBOUND_COMMENTARY_PATTERNS: ReadonlyArray<OutboundCommentaryPattern> = Object.freeze(
  [
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
  ],
);

/**
 * Clone a regex before every scan. RegExp instances with the `g`
 * flag carry a mutable `lastIndex`; cloning keeps sanitizers built
 * over the shared catalogue stateless.
 *
 * @stable
 */
export function freshRegex(re: RegExp): RegExp {
  return new RegExp(re.source, re.flags);
}

/**
 * Split a body into already-wrapped + plain segments so a sanitizer
 * never re-scans inside an existing wrap envelope. This is the
 * idempotency primitive that makes layered outbound sanitization
 * (storage-write, wire-emission, channel delivery) composable: a
 * second pass over previously-sanitized output is bytes-equal.
 *
 * @stable
 */
export function splitByWrapEnvelope(
  text: string,
  open: string,
  close: string,
): ReadonlyArray<{ readonly kind: 'plain' | 'wrapped'; readonly text: string }> {
  const out: { kind: 'plain' | 'wrapped'; text: string }[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const openAt = text.indexOf(open, cursor);
    if (openAt < 0) {
      out.push({ kind: 'plain', text: text.slice(cursor) });
      break;
    }
    if (openAt > cursor) {
      out.push({ kind: 'plain', text: text.slice(cursor, openAt) });
    }
    const closeAt = text.indexOf(close, openAt + open.length);
    if (closeAt < 0) {
      // Malformed wrap; treat the rest as plain so we still process it.
      out.push({ kind: 'plain', text: text.slice(openAt) });
      break;
    }
    out.push({ kind: 'wrapped', text: text.slice(openAt, closeAt + close.length) });
    cursor = closeAt + close.length;
  }
  return out;
}

/**
 * Hex-encoded SHA-256 of a UTF-8 string. Used for the before/after
 * digests on sanitization audit rows (raw payloads never reach the
 * audit log).
 *
 * @stable
 */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
