/**
 * Inbound prompt-injection sanitization.
 *
 * Runs AFTER the result truncation pipeline, BEFORE the result reaches
 * the conversation history. The five policy values map to deterministic
 * branches:
 *
 * - `'pass-through'`              → no scan; bytes-equal forwarding.
 * - `'detect-and-flag'`           → scan; flag hits but do not modify
 *   the body.
 * - `'detect-and-strip'`          → replace each match with the
 *   `[REDACTED:imperative-pattern]` literal token.
 * - `'detect-and-wrap'`           → wrap the body in the
 *   `<<<untrusted_content>>>` envelope without stripping matches.
 * - `'detect-and-strip-and-wrap'` → both strip matches and wrap the
 *   resulting body.
 *
 * @packageDocumentation
 */

import type { InboundSanitizationPolicy, ToolTrustClass } from '@graphorin/core';
import {
  BUILT_IN_IMPERATIVE_PATTERNS,
  type ImperativePattern,
  scanImperativePatterns,
  stripImperativePatterns,
} from '@graphorin/observability/redaction';

/**
 * Outcome of {@link applyInboundSanitization}.
 *
 * @stable
 */
export interface SanitizationOutcome {
  /** Final body that flows downstream. */
  readonly body: string;
  /** Whether the body was modified relative to the input. */
  readonly modified: boolean;
  /** Pattern names that fired during the scan. */
  readonly patternsHit: ReadonlyArray<string>;
  /** Whether the body is wrapped in the untrusted-content envelope. */
  readonly wrapped: boolean;
  /** Whether matches were stripped. */
  readonly stripped: boolean;
  /** Bytes removed by the strip pass. */
  readonly bytesStripped: number;
  /** Time spent on the scan in microseconds. */
  readonly scanDurationUs: number;
  /** Whether the scan timed out (best-effort fallthrough). */
  readonly scanTimedOut: boolean;
  /**
   * Set when `failClosed: true` and at least one pattern fired. The
   * executor surfaces this as `ToolError({ kind: 'inbound_sanitization_blocked' })`.
   */
  readonly blocked: boolean;
}

/**
 * Apply the per-policy inbound sanitization.
 *
 * ## Defense posture (why `failClosed` defaults to off)
 *
 * `failClosed` is opt-in by design, NOT because the default is
 * fail-open in the dangerous sense. The trust-class default matrix
 * (`defaultInboundSanitization`) already neutralizes untrusted
 * content without `failClosed`:
 *
 * - `mcp-derived` / `skill-untrusted` / `web-search` →
 *   `'detect-and-strip-and-wrap'`: matched imperative patterns are
 *   stripped AND the body is wrapped in the `<<<untrusted_content>>>`
 *   envelope, so injection is defanged while legitimate content (e.g.
 *   a web result that merely quotes "ignore previous instructions")
 *   still flows.
 * - `first-party-user-defined` / `skill-trusted` →
 *   `'detect-and-flag'`: flagged for operator visibility, body
 *   unchanged (the content origin is trusted).
 *
 * `failClosed: true` upgrades a *hit* from "sanitize and continue" to
 * a hard block (`ToolError({ kind: 'inbound_sanitization_blocked' })`).
 * Operators running high-assurance deployments opt in per-tool via
 * `tool({ failClosed: true })`. Defaulting it to `true` globally would
 * convert every web-search / MCP result that quotes imperative text
 * into a tool failure — which is why it stays opt-in.
 *
 * @stable
 */
export function applyInboundSanitization(opts: {
  readonly body: string;
  readonly policy: InboundSanitizationPolicy;
  readonly trustClass: ToolTrustClass;
  readonly toolName: string;
  readonly contentOrigin?: string;
  readonly failClosed?: boolean;
  readonly patterns?: ReadonlyArray<ImperativePattern>;
  /** Best-effort scan budget in milliseconds. Default `5`. */
  readonly budgetMs?: number;
}): SanitizationOutcome {
  if (opts.policy === 'pass-through') {
    return Object.freeze({
      body: opts.body,
      modified: false,
      patternsHit: Object.freeze<string[]>([]),
      wrapped: false,
      stripped: false,
      bytesStripped: 0,
      scanDurationUs: 0,
      scanTimedOut: false,
      blocked: false,
    });
  }

  const patterns = opts.patterns ?? BUILT_IN_IMPERATIVE_PATTERNS;
  // Default scan budget. 5 ms is the long-term production target but
  // is empirically too tight on cold V8 (the very first scan after a
  // fresh worker / serverless cold-start measures 6-12 ms on hosted
  // CI runners; subsequent scans run in <1 ms). A 50 ms ceiling is
  // still well below any user-perceptible latency and avoids
  // silently skipping the strip pass on every freshly-warmed
  // process. Callers that need a stricter budget (e.g. a hot-path
  // benchmark) still pass `budgetMs` explicitly.
  const scan = scanImperativePatterns(opts.body, patterns, opts.budgetMs ?? 50);
  const scanTimedOut = scan === null;
  const hits = scan?.hits ?? [];
  const patternsHit = Object.freeze(hits.map((h) => h.pattern));
  const blocked = opts.failClosed === true && patternsHit.length > 0;

  if (blocked) {
    return Object.freeze({
      body: opts.body,
      modified: false,
      patternsHit,
      wrapped: false,
      stripped: false,
      bytesStripped: 0,
      scanDurationUs: scan?.scanDurationUs ?? 0,
      scanTimedOut,
      blocked: true,
    });
  }

  let body = opts.body;
  let stripped = false;
  let bytesStripped = 0;
  // Skip the strip pass entirely when the scan timed out — we have no
  // confidence the catalogue ran to completion, so applying mutations
  // could over-redact OR under-redact unpredictably. The wrap envelope
  // (when requested) still applies because it does not depend on a
  // successful scan.
  if (
    !scanTimedOut &&
    (opts.policy === 'detect-and-strip' || opts.policy === 'detect-and-strip-and-wrap')
  ) {
    const next = stripImperativePatterns(body, patterns);
    if (next !== body) {
      stripped = true;
      bytesStripped = body.length - next.length;
      body = next;
    }
  }

  let wrapped = false;
  if (opts.policy === 'detect-and-wrap' || opts.policy === 'detect-and-strip-and-wrap') {
    body = wrapEnvelope(body, opts.trustClass, opts.toolName, opts.contentOrigin);
    wrapped = true;
  }

  return Object.freeze({
    body,
    modified: stripped || wrapped,
    patternsHit,
    wrapped,
    stripped,
    bytesStripped,
    scanDurationUs: scan?.scanDurationUs ?? 0,
    scanTimedOut,
    blocked: false,
  });
}

function wrapEnvelope(
  body: string,
  trustClass: ToolTrustClass,
  toolName: string,
  origin?: string,
): string {
  const originAttr = origin === undefined ? '' : ` origin="${escapeAttr(origin)}"`;
  return `<<<untrusted_content trust="${trustClass}" tool="${escapeAttr(toolName)}"${originAttr}>>>\n${body}\n<<</untrusted_content>>>`;
}

function escapeAttr(raw: string): string {
  return raw.replace(/"/g, '&quot;');
}
