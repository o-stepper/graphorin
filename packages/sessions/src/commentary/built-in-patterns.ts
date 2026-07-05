/**
 * Built-in commentary-phase trace patterns.
 *
 * The catalogue covers the seven event-shape signatures the agent
 * runtime can emit which, if leaked into a user-visible text part,
 * disclose internal tool execution detail. The catalogue is
 * intentionally **disjoint** from the PII / secrets patterns in
 * `@graphorin/observability/redaction` and from the prompt-injection
 * imperative patterns in
 * `@graphorin/observability/redaction/imperative-patterns`. The three
 * pattern families cover non-overlapping concerns by construction so
 * no double-counting on a single content part.
 *
 * Add to this catalogue freely - the only requirement is that the
 * `reason` discriminator stays bounded so counter cardinality stays
 * predictable.
 *
 * @packageDocumentation
 */

import type { CommentaryPattern } from './types.js';

/**
 * The framework-shipped catalogue. Snapshot bytes-equal across
 * boundaries; idempotent on a single content part (the wrap envelope
 * itself is not matched by any pattern).
 *
 * @stable
 */
export const BUILT_IN_COMMENTARY_PATTERNS: ReadonlyArray<CommentaryPattern> = Object.freeze([
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
