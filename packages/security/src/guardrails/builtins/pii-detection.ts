/**
 * `piiDetection` - block / rewrite when the value contains common PII
 * patterns. The default catalogue covers email, credit card (Luhn),
 * IBAN, US SSN, US phone, and Bitcoin address shapes; it is not
 * exhaustive and is intentionally English-locale-friendly. The
 * outbound `withRedaction` provider middleware (Phase 06) covers the
 * "no sensitive values in non-local LLM prompts" half of the same
 * problem with a richer catalogue. The OTLP `RedactionValidator`
 * (DEC-141 / ADR-035) shares the pattern-shape contract; both layers
 * compose orthogonally for defence in depth.
 *
 * Reference: the project's security architecture, § Guardrails +
 * threat-model boundary § OTLP outbound (LLM02).
 *
 * @packageDocumentation
 */

import { defineInputGuardrail, defineOutputGuardrail } from '../builders.js';
import type {
  GuardrailDefinition,
  GuardrailResult,
  InputGuardrail,
  OutputGuardrail,
} from '../types.js';

/**
 * One pattern in the catalogue. The `kind` discriminator surfaces in
 * audit metadata so SIEM dashboards can filter by sensitive type.
 *
 * @stable
 */
export interface PiiPattern {
  readonly kind: string;
  readonly pattern: RegExp;
  /** Optional post-match validator (e.g. Luhn check for credit cards). */
  readonly validate?: (match: string) => boolean;
}

/**
 * Default catalogue of PII patterns.
 *
 * @stable
 */
export const DEFAULT_PII_PATTERNS: ReadonlyArray<PiiPattern> = Object.freeze([
  Object.freeze({
    kind: 'email',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  }),
  Object.freeze({
    kind: 'us-ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
  }),
  Object.freeze({
    kind: 'us-phone',
    pattern: /(?:\+?1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g,
  }),
  Object.freeze({
    kind: 'credit-card',
    pattern: /\b(?:\d[ -]?){13,19}\b/g,
    validate: luhn,
  }),
  Object.freeze({
    kind: 'iban',
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
  }),
  Object.freeze({
    kind: 'btc-address',
    pattern: /\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/g,
  }),
]);

/**
 * Options for `piiDetection(...)`.
 *
 * @stable
 */
export interface PiiDetectionOptions {
  /** Additional patterns merged with the default catalogue. */
  readonly extraPatterns?: ReadonlyArray<PiiPattern>;
  /** Replace the default catalogue entirely. */
  readonly patterns?: ReadonlyArray<PiiPattern>;
  /**
   * Action to take on a match. Defaults to `'rewrite'` (mask the
   * detected substring with `[REDACTED:<kind>]`).
   */
  readonly action?: 'block' | 'warn' | 'rewrite';
  /** Stage the guardrail applies to. Defaults to `'input'`. */
  readonly stage?: 'input' | 'output';
  /** Override guardrail name. */
  readonly name?: string;
}

/**
 * SDF-8 / FIDES-lattice: does `text` contain any catalogued PII (email, SSN,
 * phone, Luhn-valid card, …)? A pure, allocation-light predicate that returns on
 * the first valid match and honours per-pattern `validate` (e.g. Luhn). Used to
 * feed user/PII content into the dataflow taint ledger's `sensitiveSeen` leg so
 * PII exfiltration trips the lethal-trifecta gate even without a `'secret'` tag.
 *
 * @stable
 */
export function containsPii(
  text: string,
  patterns: ReadonlyArray<PiiPattern> = DEFAULT_PII_PATTERNS,
): boolean {
  for (const pat of patterns) {
    const re = new RegExp(
      pat.pattern.source,
      pat.pattern.flags.includes('g') ? pat.pattern.flags : `${pat.pattern.flags}g`,
    );
    let m = re.exec(text);
    while (m !== null) {
      if (pat.validate === undefined || pat.validate(m[0])) return true;
      // Validator rejected this match (e.g. Luhn fail); the global regex has
      // already advanced lastIndex, so continue scanning for the next hit.
      m = re.exec(text);
    }
  }
  return false;
}

/**
 * Construct the PII detection guardrail.
 *
 * @stable
 */
export function piiDetection<TValue = unknown>(
  opts: PiiDetectionOptions = {},
): GuardrailDefinition<TValue> {
  const patterns = Object.freeze([
    ...(opts.patterns ?? DEFAULT_PII_PATTERNS),
    ...(opts.extraPatterns ?? []),
  ]);
  const action = opts.action ?? 'rewrite';
  const stage = opts.stage ?? 'input';
  const name = opts.name ?? 'piiDetection';

  /** Redact every pattern match in one string; collects matched kinds. */
  const redactText = (input: string, matchedKinds: string[]): string => {
    let text = input;
    for (const pat of patterns) {
      const re = new RegExp(
        pat.pattern.source,
        pat.pattern.flags.includes('g') ? pat.pattern.flags : `${pat.pattern.flags}g`,
      );
      let m = re.exec(text);
      while (m !== null) {
        if (pat.validate && !pat.validate(m[0])) {
          m = re.exec(text);
          continue;
        }
        matchedKinds.push(pat.kind);
        const replacement = `[REDACTED:${pat.kind}]`;
        text = text.slice(0, m.index) + replacement + text.slice(m.index + m[0].length);
        re.lastIndex = m.index + replacement.length;
        m = re.exec(text);
      }
    }
    return text;
  };

  /**
   * SDF-6: deep-walk string leaves so structured values are REDACTED,
   * never reported-redacted-but-returned-verbatim. Arrays/plain objects
   * recurse; other values pass through untouched.
   */
  const redactValue = (input: unknown, matchedKinds: string[]): unknown => {
    if (typeof input === 'string') return redactText(input, matchedKinds);
    if (Array.isArray(input)) return input.map((item) => redactValue(item, matchedKinds));
    if (input !== null && typeof input === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
        out[key] = redactValue(val, matchedKinds);
      }
      return out;
    }
    return input;
  };

  const spec = {
    name,
    check: (value: TValue): GuardrailResult<TValue> => {
      const matchedKinds: string[] = [];
      const redacted = redactValue(value, matchedKinds);
      if (matchedKinds.length === 0) return { ok: true };
      const result: GuardrailResult<TValue> = {
        ok: false,
        action,
        message: `value contains ${matchedKinds.length} PII match(es): ${[...new Set(matchedKinds)].join(', ')}`,
        // SDF-6 invariant: a rewrite is never the unredacted input -
        // string leaves with matches were replaced above for every
        // value shape (string, array, object).
        ...(action === 'rewrite' ? { rewrite: redacted as TValue } : {}),
        metadata: Object.freeze({ matchedKinds }),
      };
      return result;
    },
  };

  return stage === 'input'
    ? (defineInputGuardrail<TValue>(spec) as InputGuardrail<TValue>)
    : (defineOutputGuardrail<TValue>(spec) as OutputGuardrail<TValue>);
}

/**
 * Luhn checksum for credit-card validation.
 *
 * @stable
 */
export function luhn(value: string): boolean {
  const digits = value.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
