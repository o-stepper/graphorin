/**
 * Per-message commentary-phase trace sanitizer. Used by the four
 * session-output boundaries (`Session.push / list / export / replay`)
 * to detect and handle internal tool-call trace fragments leaking
 * into user-visible text.
 *
 * The sanitizer is bytes-equal across the four boundaries: the same
 * input + same `commentaryPolicy` produces the same output regardless
 * of which boundary invoked it. This is the load-bearing property
 * that makes the layered defense idempotent.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import type {
  AssistantMessage,
  Message,
  MessageContent,
  ToolMessage,
  UserMessage,
} from '@graphorin/core';
import { BUILT_IN_COMMENTARY_PATTERNS } from './built-in-patterns.js';
import type {
  CommentaryBoundary,
  CommentaryPattern,
  CommentaryPolicy,
  CommentaryReason,
  CommentarySanitizationDecision,
} from './types.js';

const DEFAULT_OPEN = '<<<commentary>>>';
const DEFAULT_CLOSE = '<<</commentary>>>';

/**
 * Options accepted by {@link createCommentarySanitizer}.
 *
 * @stable
 */
export interface CommentarySanitizerOptions {
  /** Default `'wrap'`. */
  readonly policy?: CommentaryPolicy;
  /**
   * Override the built-in pattern catalogue. The default exports the
   * full {@link BUILT_IN_COMMENTARY_PATTERNS} list; deployments that
   * want to add custom patterns should append, not replace.
   */
  readonly patterns?: ReadonlyArray<CommentaryPattern>;
  /** Override the wrap envelope (test seam / branding). */
  readonly wrapOpen?: string;
  /** Override the wrap envelope close (test seam / branding). */
  readonly wrapClose?: string;
}

/**
 * Result of sanitizing a single `MessageContent` part.
 *
 * @stable
 */
export interface CommentarySanitizationResult {
  readonly part: MessageContent;
  readonly decision: CommentarySanitizationDecision;
}

/**
 * Stateless, deterministic sanitizer. The methods are async-friendly
 * but synchronous on the inside; the API is structured this way so
 * future revisions can move the regex pass into a worker pool.
 *
 * @stable
 */
export interface CommentarySanitizer {
  readonly policy: CommentaryPolicy;
  readonly patterns: ReadonlyArray<CommentaryPattern>;
  /**
   * Sanitize a single `MessageContent` part. Returns the (possibly
   * unchanged) part plus the audit-level decision.
   */
  sanitizePart(part: MessageContent, boundary: CommentaryBoundary): CommentarySanitizationResult;
  /**
   * Sanitize every `MessageContent` part on a `Message`. Returns the
   * (possibly unchanged) message plus per-part decisions in source
   * order. `system` messages are pass-through (their `content` is a
   * plain string with no commentary potential).
   */
  sanitizeMessage(
    message: Message,
    boundary: CommentaryBoundary,
  ): {
    readonly message: Message;
    readonly decisions: ReadonlyArray<CommentarySanitizationDecision>;
  };
}

/**
 * Build a stateless commentary-phase sanitizer.
 *
 * @stable
 */
export function createCommentarySanitizer(
  options: CommentarySanitizerOptions = {},
): CommentarySanitizer {
  const policy: CommentaryPolicy = options.policy ?? 'wrap';
  const patterns: ReadonlyArray<CommentaryPattern> =
    options.patterns ?? BUILT_IN_COMMENTARY_PATTERNS;
  const open = options.wrapOpen ?? DEFAULT_OPEN;
  const close = options.wrapClose ?? DEFAULT_CLOSE;

  function applyToText(text: string): {
    readonly transformed: string;
    readonly reasons: ReadonlyArray<CommentaryReason>;
    readonly applied: boolean;
  } {
    if (policy === 'pass-through') {
      return { transformed: text, reasons: [], applied: false };
    }
    // Split the body into already-wrapped + plain segments so we
    // never re-scan inside a wrap envelope. This makes the
    // sanitizer idempotent on the same content.
    const segments = splitByWrapEnvelope(text, open, close);
    const matchedReasons = new Set<CommentaryReason>();
    let mutated = false;
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
        if (didMatch) {
          matchedReasons.add(pattern.reason);
          mutated = true;
        }
      }
      next.push(segText);
    }
    const transformed = next.join('');
    return {
      transformed,
      reasons: [...matchedReasons],
      applied: mutated && transformed !== text,
    };
  }

  function sanitizePart(
    part: MessageContent,
    boundary: CommentaryBoundary,
  ): CommentarySanitizationResult {
    const beforeBytes = bytesOf(part);
    if (part.type === 'text' || part.type === 'reasoning') {
      const out = applyToText(part.text);
      const next: MessageContent = out.applied ? { ...part, text: out.transformed } : part;
      const afterBytes = bytesOf(next);
      return {
        part: next,
        decision: {
          boundary,
          policy,
          applied: out.applied,
          reasons: out.reasons,
          sha256OfBefore: sha256(beforeBytes),
          sha256OfAfter: sha256(afterBytes),
        },
      };
    }
    // Non-text parts (image / audio / file) carry no commentary text.
    return {
      part,
      decision: {
        boundary,
        policy,
        applied: false,
        reasons: [],
        sha256OfBefore: sha256(beforeBytes),
        sha256OfAfter: sha256(beforeBytes),
      },
    };
  }

  function sanitizeMessage(
    message: Message,
    boundary: CommentaryBoundary,
  ): {
    readonly message: Message;
    readonly decisions: ReadonlyArray<CommentarySanitizationDecision>;
  } {
    if (message.role === 'system') {
      return { message, decisions: [] };
    }
    if (typeof message.content === 'string') {
      const wrapped: MessageContent = { type: 'text', text: message.content };
      const sanitized = sanitizePart(wrapped, boundary);
      if (!sanitized.decision.applied) {
        return { message, decisions: [sanitized.decision] };
      }
      const text = sanitized.part.type === 'text' ? sanitized.part.text : message.content;
      const next = withContent(message, text);
      return { message: next, decisions: [sanitized.decision] };
    }
    const decisions: CommentarySanitizationDecision[] = [];
    const nextParts: MessageContent[] = [];
    let mutated = false;
    for (const part of message.content) {
      const out = sanitizePart(part, boundary);
      decisions.push(out.decision);
      nextParts.push(out.part);
      if (out.decision.applied) mutated = true;
    }
    if (!mutated) return { message, decisions };
    const next = withContent(message, nextParts);
    return { message: next, decisions };
  }

  return Object.freeze({
    policy,
    patterns,
    sanitizePart,
    sanitizeMessage,
  });
}

function withContent(
  message: UserMessage | AssistantMessage | ToolMessage,
  content: string | ReadonlyArray<MessageContent>,
): Message {
  if (message.role === 'user') {
    return { ...message, content };
  }
  if (message.role === 'assistant') {
    return { ...message, content };
  }
  return { ...message, content };
}

function freshRegex(re: RegExp): RegExp {
  // RegExp instances with the `g` flag carry mutable lastIndex; clone
  // every time so the sanitizer stays stateless.
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
      // Malformed wrap; treat the rest as plain so we still process it.
      out.push({ kind: 'plain', text: text.slice(openAt) });
      break;
    }
    out.push({ kind: 'wrapped', text: text.slice(openAt, closeAt + close.length) });
    cursor = closeAt + close.length;
  }
  return out;
}

function bytesOf(part: MessageContent): string {
  if (part.type === 'text' || part.type === 'reasoning') return part.text;
  // Hash the type + JSON of the part for non-text inputs so we still
  // produce stable before/after hashes for the audit row.
  return JSON.stringify({
    type: part.type,
    mimeType: 'mimeType' in part ? part.mimeType : undefined,
  });
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
