/**
 * Untrusted-content envelope helpers shared across the memory package.
 *
 * Extracted from the CE-15 compaction-summary neutralization
 * (`wrapSummaryAsDerived` in `context-engine/compaction/compactor.ts`)
 * so every prompt that interpolates untrusted memory text (compaction
 * summaries, reconcile neighbours, deep-phase judge candidates,
 * reflection evidence) delimits it with ONE substitution scheme. The
 * scheme is the same visible bracket-substitution `@graphorin/tools`
 * applies in `wrapEnvelope` (W-030): the closing marker
 * `<<</untrusted_content>>>` becomes `[[/untrusted_content]]` and the
 * opening prefix `<<<untrusted_content` becomes `[[untrusted_content`,
 * tolerant to case and whitespace. Zero-width insertion is not used -
 * models read straight through zero-width splits (the reason
 * `normalizeForMatching` strips them before injection scans).
 *
 * The helper is deliberately local: `@graphorin/memory` does not
 * depend on `@graphorin/tools`, and the substitution scheme is a
 * cross-package SPEC pinned by tests on literal-marker inputs.
 *
 * @packageDocumentation
 */

/** Opening delimiter prefix of the untrusted-content envelope. */
export const UNTRUSTED_CONTENT_OPEN_PREFIX = '<<<untrusted_content';

/** Closing delimiter of the untrusted-content envelope. */
export const UNTRUSTED_CONTENT_CLOSE = '<<</untrusted_content>>>';

// Tolerant embedded-marker matching, mirroring the tools package: the
// closing form optionally consumes its `>>>` terminator so the full
// marker collapses to `[[/untrusted_content]]`.
const EMBEDDED_CLOSING_RE = /<<<\s*\/\s*untrusted_content(\s*>>>)?/gi;
const EMBEDDED_OPENING_RE = /<<<\s*untrusted_content/gi;

/**
 * Replace envelope markers embedded in `body` with the visible `[[` /
 * `]]` bracket-substitution so the body cannot prematurely close (or
 * spoof a nested opening of) the envelope it is being wrapped into.
 * Marker-free bodies are returned bytes-equal.
 *
 * @internal
 */
export function neutralizeEnvelopeMarkers(body: string): string {
  if (!body.includes('<<<')) return body;
  return body
    .replace(EMBEDDED_CLOSING_RE, (_match, terminator) =>
      terminator === undefined ? '[[/untrusted_content' : '[[/untrusted_content]]',
    )
    .replace(EMBEDDED_OPENING_RE, '[[untrusted_content');
}

/**
 * Wrap `body` in the untrusted-content envelope with the supplied
 * attributes, neutralizing embedded markers first. Attribute insertion
 * order is preserved, so
 * `wrapUntrusted(body, { trust: 'derived', tool: 'compaction-summarizer' })`
 * reproduces the historical CE-15 output byte-for-byte.
 *
 * @internal
 */
export function wrapUntrusted(body: string, attrs?: Readonly<Record<string, string>>): string {
  const attrStr =
    attrs === undefined
      ? ''
      : Object.entries(attrs)
          .map(([key, value]) => ` ${key}="${value.replace(/"/g, '&quot;')}"`)
          .join('');
  return `${UNTRUSTED_CONTENT_OPEN_PREFIX}${attrStr}>>>\n${neutralizeEnvelopeMarkers(body)}\n${UNTRUSTED_CONTENT_CLOSE}`;
}
