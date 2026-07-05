/**
 * C6: shared Unicode pre-pass for the injection/PII pattern catalogues
 * (pairs security-04/07). Character-injection defeats naive regex
 * catalogues at up to 100% (Bypassing LLM Guardrails, 2504.11168):
 * zero-width joiners split keywords, fullwidth/compatibility homoglyphs
 * swap code points. Folding to NFKC and stripping the zero-width class
 * BEFORE matching closes the cheap half of that surface. Cross-script
 * confusables (e.g. Cyrillic lookalikes) survive NFKC and remain out of
 * scope - the catalogues stay best-effort SIGNAL, never a sole gate.
 *
 * @packageDocumentation
 */

/** Zero-width / soft-hyphen / word-joiner characters used to split keywords. */
const ZERO_WIDTH_RE = /[\u00ad\u200b-\u200f\u2060\ufeff]/g;

/**
 * Fold text to a match-friendly form: NFKC (collapses fullwidth /
 * compatibility homoglyphs), strip zero-width characters, lowercase.
 * Whitespace and punctuation are PRESERVED (unlike the taint ledger's
 * alphanumeric-only fold) so word-boundary regexes keep working.
 *
 * @stable
 */
export function normalizeForMatching(text: string): string {
  return text.normalize('NFKC').replace(ZERO_WIDTH_RE, '').toLowerCase();
}
