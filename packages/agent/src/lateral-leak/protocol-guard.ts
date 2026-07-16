/**
 * Protocol/header injection guard - escapes control characters in
 * tool result bodies before they cross internal-service delivery
 * boundaries (SSE, WebSocket, REST body, HTTP header, audit row).
 *
 * The default policy mirrors the deployment-posture matrix from the
 * lateral-leak design (DEC-171 / suggested ADR-059):
 *
 * - `'sse' | 'http-header'`  → `'strict'`  (escape control chars to
 *   `\xNN` hex literals; the safest default for cleartext frame
 *   protocols).
 * - `'ws' | 'rest-body'`     → `'replace'` (replace with the Unicode
 *   replacement character `\uFFFD`).
 * - `'audit'`                → `'strict'`  (regulated deployments).
 * - `'reject'` is operator opt-in - the guard throws
 *   {@link ProtocolInjectionRejectError} when control characters are
 *   detected.
 *
 * @packageDocumentation
 */

import { ProtocolInjectionRejectError } from '../errors/index.js';

/**
 * Per-boundary identifier used by the runtime when calling the
 * guard.
 *
 * @stable
 */
export type ProtocolBoundary = 'sse' | 'http-header' | 'ws' | 'rest-body' | 'audit';

/**
 * Per-boundary escape policy.
 *
 * @stable
 */
export type ProtocolEscapePolicy = 'strict' | 'replace' | 'reject';

/**
 * Configurable per-boundary policy table. There is no agent-level
 * config key for it in the current slice - the embedding surface
 * (server route, channel adapter, custom harness) constructs the
 * table and passes it to the escape helpers explicitly.
 *
 * @stable
 */
export interface ProtocolGuardConfig {
  readonly sse?: ProtocolEscapePolicy;
  readonly httpHeader?: ProtocolEscapePolicy;
  readonly ws?: ProtocolEscapePolicy;
  readonly restBody?: ProtocolEscapePolicy;
  readonly audit?: ProtocolEscapePolicy;
}

/**
 * Resolved policy lookup. Pure function - no side effects.
 *
 * @stable
 */
export function resolvePolicy(
  boundary: ProtocolBoundary,
  cfg: ProtocolGuardConfig = {},
): ProtocolEscapePolicy {
  switch (boundary) {
    case 'sse':
      return cfg.sse ?? 'strict';
    case 'http-header':
      return cfg.httpHeader ?? 'strict';
    case 'ws':
      return cfg.ws ?? 'replace';
    case 'rest-body':
      return cfg.restBody ?? 'replace';
    case 'audit':
      return cfg.audit ?? 'strict';
    default: {
      const _exhaustive: never = boundary;
      void _exhaustive;
      return 'strict';
    }
  }
}

// Control-character catalogue used to detect injection attempts at
// the framework's outbound delivery boundaries. Building the regex
// programmatically avoids embedding control bytes in the source -
// the bytes are exactly the ones a malicious tool result might
// inject to escape framing on cleartext protocols.
function buildControlCharsRegex(): RegExp {
  const codePoints: number[] = [];
  for (let n = 0; n < 0x20; n++) {
    if (n === 0x09 || n === 0x0a || n === 0x0d) continue;
    codePoints.push(n);
  }
  codePoints.push(0x7f);
  const cls = codePoints.map((c) => `\\x${c.toString(16).padStart(2, '0')}`).join('');
  return new RegExp(`[${cls}]`, 'g');
}
const CONTROL_CHARS_RE = buildControlCharsRegex();
const SSE_FRAME_RE = /\r?\n\r?\n/g;
const HEADER_CRLF_RE = /\r\n/g;

/**
 * Outcome of {@link guardOutboundContent}.
 *
 * @stable
 */
export interface GuardOutcome {
  readonly content: string;
  readonly escapedCharCount: number;
  readonly matchedPattern?: string;
  readonly decision: 'pass-through' | 'escaped' | 'replaced' | 'rejected';
  readonly boundary: ProtocolBoundary;
  readonly policy: ProtocolEscapePolicy;
}

function escapeStrict(
  input: string,
  boundary: ProtocolBoundary,
): { content: string; count: number } {
  let count = 0;
  let out = input.replace(CONTROL_CHARS_RE, (ch) => {
    count += 1;
    return `\\x${ch.charCodeAt(0).toString(16).padStart(2, '0')}`;
  });
  if (boundary === 'sse') {
    out = out.replace(SSE_FRAME_RE, (m) => {
      count += 1;
      return m.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    });
  }
  if (boundary === 'http-header' || boundary === 'audit') {
    out = out.replace(HEADER_CRLF_RE, () => {
      count += 1;
      return '\\r\\n';
    });
  }
  return { content: out, count };
}

function replaceUFFFD(input: string): { content: string; count: number } {
  let count = 0;
  const out = input.replace(CONTROL_CHARS_RE, () => {
    count += 1;
    return '\uFFFD';
  });
  return { content: out, count };
}

function findMatchedPattern(input: string): string | undefined {
  if (CONTROL_CHARS_RE.test(input)) {
    CONTROL_CHARS_RE.lastIndex = 0;
    return 'control-char';
  }
  if (SSE_FRAME_RE.test(input)) {
    SSE_FRAME_RE.lastIndex = 0;
    return 'sse-frame';
  }
  if (HEADER_CRLF_RE.test(input)) {
    HEADER_CRLF_RE.lastIndex = 0;
    return 'header-crlf';
  }
  return undefined;
}

/**
 * Apply the configured escape policy to a single string body. Pure
 * - never mutates inputs.
 *
 * @stable
 */
export function guardOutboundContent(
  input: string,
  boundary: ProtocolBoundary,
  cfg: ProtocolGuardConfig = {},
): GuardOutcome {
  const policy = resolvePolicy(boundary, cfg);
  const matchedPattern = findMatchedPattern(input);
  if (matchedPattern === undefined) {
    return {
      content: input,
      escapedCharCount: 0,
      decision: 'pass-through',
      boundary,
      policy,
    };
  }
  switch (policy) {
    case 'strict': {
      const r = escapeStrict(input, boundary);
      return {
        content: r.content,
        escapedCharCount: r.count,
        matchedPattern,
        decision: 'escaped',
        boundary,
        policy,
      };
    }
    case 'replace': {
      const r = replaceUFFFD(input);
      return {
        content: r.content,
        escapedCharCount: r.count,
        matchedPattern,
        decision: 'replaced',
        boundary,
        policy,
      };
    }
    case 'reject':
      throw new ProtocolInjectionRejectError(boundary, matchedPattern);
    default: {
      const _exhaustive: never = policy;
      void _exhaustive;
      return {
        content: input,
        escapedCharCount: 0,
        decision: 'pass-through',
        boundary,
        policy,
      };
    }
  }
}
