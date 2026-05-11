/**
 * Stateless delivery-layer commentary-phase trace sanitizer. Walks
 * outbound `ServerMessage` event frames and applies the configured
 * pattern catalogue to the JSON-stringified payload; matched
 * fragments are wrapped in the configured envelope (default) or
 * stripped (per the `'strip'` policy) or passed through (per the
 * `'pass-through'` policy — operator opt-out for trusted
 * deployments).
 *
 * The sanitizer runs AFTER the `ServerMessage` Zod-validation pass
 * in `@graphorin/protocol` and BEFORE the message hits the wire (so
 * the protocol schema is unchanged; the sanitization is a pure
 * transform applied to validated payloads). It is bytes-equal across
 * the WS / SSE / REST transports — the same input + same policy
 * produces the same output regardless of which transport invoked
 * the sanitizer.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import type { ServerEventFrame } from '@graphorin/protocol';

import {
  DEFAULT_APPLY_TO_EVENTS,
  DEFAULT_DELIVERY_COMMENTARY_PATTERNS,
} from './built-in-patterns.js';
import type {
  DeliveryCommentaryConfig,
  DeliveryCommentaryDecision,
  DeliveryCommentaryPattern,
  DeliveryCommentaryPolicy,
  DeliveryCommentaryReason,
  DeliveryCommentarySink,
  DeliveryCommentaryTransport,
} from './types.js';

const DEFAULT_OPEN = '<<<commentary>>>';
const DEFAULT_CLOSE = '<<</commentary>>>';

/**
 * Public surface returned by {@link createDeliveryCommentarySanitizer}.
 *
 * @stable
 */
export interface DeliveryCommentarySanitizer {
  readonly policy: DeliveryCommentaryPolicy;
  readonly applyToEvents: ReadonlyArray<string>;
  readonly patterns: ReadonlyArray<DeliveryCommentaryPattern>;
  /**
   * Sanitize the payload of a single `event` frame. Returns the
   * (possibly-replaced) frame; emits an audit decision via the
   * configured sink when the sanitizer mutated the payload.
   *
   * The frame is returned unchanged when:
   *   - the policy is `'pass-through'`,
   *   - the event type is not in `applyToEvents`,
   *   - or no pattern matched the JSON-stringified payload.
   */
  sanitize(frame: ServerEventFrame, transport: DeliveryCommentaryTransport): ServerEventFrame;
}

/**
 * Build a stateless delivery-layer sanitizer. Tests can swap the
 * `sink` for an in-memory recorder; production wires the
 * `@graphorin/security/audit` `appendAudit` helper.
 *
 * @stable
 */
export function createDeliveryCommentarySanitizer(
  config: DeliveryCommentaryConfig = {},
): DeliveryCommentarySanitizer {
  const policy: DeliveryCommentaryPolicy = config.policy ?? 'wrap';
  const applyToEvents: ReadonlyArray<string> = config.applyToEvents ?? DEFAULT_APPLY_TO_EVENTS;
  const applyToSet = new Set(applyToEvents);
  const patterns: ReadonlyArray<DeliveryCommentaryPattern> =
    config.patterns ?? DEFAULT_DELIVERY_COMMENTARY_PATTERNS;
  const open = config.wrapOpen ?? DEFAULT_OPEN;
  const close = config.wrapClose ?? DEFAULT_CLOSE;
  const sink: DeliveryCommentarySink | undefined = config.sink;

  function sanitize(
    frame: ServerEventFrame,
    transport: DeliveryCommentaryTransport,
  ): ServerEventFrame {
    if (policy === 'pass-through') return frame;
    if (!applyToSet.has(frame.type)) return frame;
    const before = JSON.stringify(frame.payload ?? null);
    const allReasons = new Set<DeliveryCommentaryReason>();
    let mutated = false;
    const next = walkAndSanitize(frame.payload, (text) => {
      const out = applyToText(text, patterns, policy, open, close);
      for (const reason of out.reasons) allReasons.add(reason);
      if (out.transformed !== text) mutated = true;
      return out.transformed;
    });
    if (!mutated) return frame;
    const after = JSON.stringify(next ?? null);
    const decision: DeliveryCommentaryDecision = {
      transport,
      boundary: 'event-emission',
      policy,
      applied: true,
      reasons: [...allReasons],
      matchedPattern: [...allReasons][0],
      sha256OfBefore: sha256(before),
      sha256OfAfter: sha256(after),
      eventType: frame.type,
    };
    try {
      sink?.onDecision(decision);
    } catch {
      // Sink errors must never block the wire — swallow + continue.
    }
    return Object.freeze({ ...frame, payload: next });
  }

  return Object.freeze({
    policy,
    applyToEvents,
    patterns,
    sanitize,
  });
}

interface ApplyResult {
  readonly transformed: string;
  readonly reasons: ReadonlyArray<DeliveryCommentaryReason>;
}

/**
 * Recursively walks any JSON-shaped value (`null`, primitive, array,
 * object) and applies the supplied transform to every string leaf.
 * Returns a structurally-cloned copy when at least one leaf was
 * rewritten; returns the original input by reference otherwise.
 */
function walkAndSanitize(value: unknown, transform: (s: string) => string): unknown {
  if (typeof value === 'string') {
    const next = transform(value);
    return next === value ? value : next;
  }
  if (Array.isArray(value)) {
    let mutated = false;
    const next: unknown[] = new Array(value.length);
    for (let i = 0; i < value.length; i += 1) {
      const child = walkAndSanitize(value[i], transform);
      if (child !== value[i]) mutated = true;
      next[i] = child;
    }
    return mutated ? next : value;
  }
  if (value !== null && typeof value === 'object') {
    let mutated = false;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const child = walkAndSanitize(val, transform);
      if (child !== val) mutated = true;
      next[key] = child;
    }
    return mutated ? next : value;
  }
  return value;
}

function applyToText(
  text: string,
  patterns: ReadonlyArray<DeliveryCommentaryPattern>,
  policy: DeliveryCommentaryPolicy,
  open: string,
  close: string,
): ApplyResult {
  // Split the body into already-wrapped + plain segments so we never
  // re-scan inside an existing wrap envelope. This makes the sanitizer
  // idempotent on the same payload (a second pass produces bytes-equal
  // output, satisfying the cross-cut composition contract with
  // Phase 11 session-output sanitization + Phase 11 replay
  // sanitization).
  const segments = splitByWrapEnvelope(text, open, close);
  const matchedReasons = new Set<DeliveryCommentaryReason>();
  const next: string[] = [];
  for (const segment of segments) {
    if (segment.kind === 'wrapped') {
      next.push(segment.text);
      continue;
    }
    let segText = segment.text;
    for (const pattern of patterns) {
      const regex = freshRegex(pattern.regex);
      let didMatch = false;
      segText = segText.replace(regex, (match) => {
        didMatch = true;
        if (policy === 'strip') return '';
        return `${open}${match}${close}`;
      });
      if (didMatch) matchedReasons.add(pattern.reason);
    }
    next.push(segText);
  }
  return {
    transformed: next.join(''),
    reasons: [...matchedReasons],
  };
}

function freshRegex(re: RegExp): RegExp {
  return new RegExp(re.source, re.flags);
}

function splitByWrapEnvelope(
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
      out.push({ kind: 'plain', text: text.slice(openAt) });
      break;
    }
    out.push({ kind: 'wrapped', text: text.slice(openAt, closeAt + close.length) });
    cursor = closeAt + close.length;
  }
  return out;
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
