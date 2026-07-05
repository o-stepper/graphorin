/**
 * Untrusted-content envelope: shared delimiter constants + embedded
 * delimiter neutralization.
 *
 * The `<<<untrusted_content ...>>>` envelope is the load-bearing trust
 * boundary for inbound sanitization: the per-step preamble instructs
 * the model to treat everything inside it as data. That boundary only
 * holds if the wrapped body cannot fabricate its own delimiters - an
 * untrusted result containing a literal `<<</untrusted_content>>>`
 * would prematurely close the envelope and everything after it would
 * read as content OUTSIDE the untrusted region.
 *
 * Neutralization uses the same VISIBLE bracket-substitution the memory
 * package applies to compaction summaries (CE-15,
 * `wrapSummaryAsDerived`): the closing marker becomes
 * `[[/untrusted_content]]` and the opening prefix becomes
 * `[[untrusted_content`. Zero-width insertion is deliberately NOT used
 * as a mechanism: models read straight through zero-width splits
 * (which is exactly why `ZERO_WIDTH_RE` exists in
 * `@graphorin/security/guardrails` and why the memory injection
 * heuristics strip zero-width characters), so an invisible break would
 * pass string equality tests while leaving the model exploitable.
 *
 * @packageDocumentation
 */

/**
 * Opening delimiter prefix of the untrusted-content envelope. The full
 * opening marker carries attributes and the `>>>` terminator; the
 * prefix is the stable part both the wrapper and the neutralizer key
 * on.
 *
 * @stable
 */
export const UNTRUSTED_CONTENT_OPEN_PREFIX = '<<<untrusted_content';

/**
 * Closing delimiter of the untrusted-content envelope.
 *
 * @stable
 */
export const UNTRUSTED_CONTENT_CLOSE = '<<</untrusted_content>>>';

/**
 * Options for {@link neutralizeEnvelopeDelimiters}.
 *
 * @stable
 */
export interface NeutralizeEnvelopeDelimitersOptions {
  /**
   * Also collapse ANY run of three-or-more angle brackets (`<<<` /
   * `>>>`) to `[[` / `]]`, not just runs that spell an envelope
   * marker. Off by default: legitimate content routinely carries such
   * runs (Python doctest / REPL `>>>`, shell heredoc `<<<EOF`) and
   * mangling them would corrupt benign tool results. The envelope
   * boundary is already protected by the marker-specific substitution
   * without this.
   */
  readonly neutralizeAngleRuns?: boolean;
}

// Tolerant embedded-marker matching: case-insensitive, whitespace
// allowed after `<<<` and around `/`. Stricter literal-only matching
// (the CE-15 original) would let `<<< /UNTRUSTED_CONTENT >>>` through
// even though the model plausibly reads it as a closing marker. The
// closing form optionally consumes its `>>>` terminator so the full
// marker collapses to `[[/untrusted_content]]`; when the terminator is
// missing (or separated by attributes) only the prefix is substituted,
// which is sufficient - without `<<<` the remainder cannot delimit
// anything.
const EMBEDDED_CLOSING_RE = /<<<\s*\/\s*untrusted_content(\s*>>>)?/gi;
const EMBEDDED_OPENING_RE = /<<<\s*untrusted_content/gi;
const ANGLE_RUN_OPEN_RE = /<{3,}/g;
const ANGLE_RUN_CLOSE_RE = />{3,}/g;

/**
 * Replace untrusted-content envelope markers embedded in `body` with
 * the visible `[[` / `]]` bracket-substitution so the body cannot
 * prematurely close (or spoof a nested opening of) the envelope that
 * `applyInboundSanitization` wraps around it.
 *
 * The substitution scheme is identical to the memory package's CE-15
 * summary neutralization on literal markers:
 * `<<</untrusted_content>>>` becomes `[[/untrusted_content]]` and the
 * `<<<untrusted_content` prefix becomes `[[untrusted_content`. Bodies
 * that contain no envelope markers are returned bytes-equal.
 *
 * @stable
 */
export function neutralizeEnvelopeDelimiters(
  body: string,
  options?: NeutralizeEnvelopeDelimitersOptions,
): string {
  const neutralizeAngleRuns = options?.neutralizeAngleRuns === true;
  // Cheap prefilter: every marker form starts with `<<<`, so bodies
  // without it (the overwhelmingly common case) return bytes-equal
  // without running the regexes. Angle-run mode also needs `>>>`.
  if (!body.includes('<<<') && !(neutralizeAngleRuns && body.includes('>>>'))) {
    return body;
  }
  let out = body.replace(EMBEDDED_CLOSING_RE, (_match, terminator) =>
    terminator === undefined ? '[[/untrusted_content' : '[[/untrusted_content]]',
  );
  out = out.replace(EMBEDDED_OPENING_RE, '[[untrusted_content');
  if (neutralizeAngleRuns) {
    out = out.replace(ANGLE_RUN_OPEN_RE, '[[').replace(ANGLE_RUN_CLOSE_RE, ']]');
  }
  return out;
}
