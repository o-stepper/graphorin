/**
 * Built-in PII / secret detection patterns. The catalogue is intentionally
 * conservative - every pattern has both positive and negative test
 * fixtures and is documented so operators understand exactly what is
 * matched.
 *
 * The catalogue is split into two groups:
 *
 * - **secret** - credentials, API tokens, JWTs, private keys. Matches
 *   are always dropped + counted, regardless of the configured tier
 *   floor.
 * - **pii** - email / phone / IBAN / credit card / SSN / IP address.
 *   Subject to the configured tier floor + per-pattern enable / disable
 *   knobs.
 *
 * @packageDocumentation
 */

/**
 * Stable pattern identifier. The catalogue is curated; user-supplied
 * patterns can use any identifier they want and will be passed through
 * the validator in addition to the built-ins.
 *
 * @stable
 */
export type BuiltInPatternName =
  | 'graphorin-token'
  | 'openai-key'
  | 'anthropic-key'
  | 'aws-access-key'
  | 'gcp-service-account'
  | 'github-pat'
  | 'jwt'
  | 'bearer-header'
  | 'basic-auth'
  | 'private-key-pem'
  | 'email'
  | 'creditcard'
  | 'us-ssn'
  | 'phone-e164'
  | 'iban'
  | 'ipv4'
  | 'ipv6';

/**
 * Pattern category - `secret` matches always force a drop; `pii`
 * matches respect the configured `enabledPatterns` allow-list.
 *
 * @stable
 */
export type PatternCategory = 'secret' | 'pii';

/**
 * One entry in the redaction catalogue.
 *
 * @stable
 */
export interface RedactionPattern {
  readonly name: string;
  readonly category: PatternCategory;
  readonly description: string;
  readonly regex: RegExp;
  /** Replacement string used when `mode === 'mask'`. */
  readonly mask?: string;
  /**
   * Optional per-match predicate. When present, a regex hit is only
   * treated as a real match - and masked - when this returns `true` for the
   * matched substring. Every catalogue consumer honours it: the OTLP
   * `RedactionValidator`, the `withRedaction` provider middleware (both the
   * request scrub and the streaming response scan), and user-supplied
   * patterns may carry their own predicate. Used by the `creditcard`
   * pattern to require a valid Luhn checksum plus a major-network leading
   * digit so look-alike digit runs (epoch-ms timestamps, order ids,
   * serialized floats) are not corrupted.
   */
  readonly verify?: (match: string) => boolean;
  /**
   * Optional opt-in flag. When `true` the pattern is **not** active by
   * default; operators must add it to `enabledPatterns` explicitly. Used
   * by the IPv4 / IPv6 patterns because raw IPs frequently appear in
   * non-PII log lines (host headers, debug traces, …).
   */
  readonly optIn?: boolean;
}

const PATTERNS: readonly RedactionPattern[] = [
  {
    name: 'graphorin-token',
    category: 'secret',
    // Matches the DEFAULT token prefix from @graphorin/security
    // (DEFAULT_TOKEN_PREFIX = 'gph'); deployments that configure a
    // custom prefix must register their own pattern. The env label is
    // matched loosely because `acceptEnvironments` is operator-extensible.
    description: 'Graphorin server token (`gph_<env>_v1_<entropy>_<crc32>`; default prefix).',
    regex: /gph_[a-z0-9]{2,12}_v1_[A-Za-z0-9]{20,80}_[A-Za-z0-9]{6}/g,
    mask: '[REDACTED graphorin-token]',
  },
  {
    name: 'openai-key',
    category: 'secret',
    description: 'OpenAI API key (`sk-...`).',
    regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
    mask: '[REDACTED openai-key]',
  },
  {
    name: 'anthropic-key',
    category: 'secret',
    description: 'Anthropic API key (`sk-ant-...`).',
    regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
    mask: '[REDACTED anthropic-key]',
  },
  {
    name: 'aws-access-key',
    category: 'secret',
    description: 'AWS access-key id (`AKIA...`).',
    regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    mask: '[REDACTED aws-access-key]',
  },
  {
    name: 'gcp-service-account',
    category: 'secret',
    description:
      'GCP service-account email (`...@...iam.gserviceaccount.com`). Opt-in; the `email` pattern already redacts the address shape; this entry exists for operators wanting the explicit `gcp-service-account` counter label.',
    regex: /[A-Za-z0-9._-]+@[A-Za-z0-9-]+\.iam\.gserviceaccount\.com\b/g,
    mask: '[REDACTED gcp-service-account]',
    optIn: true,
  },
  {
    name: 'github-pat',
    category: 'secret',
    description: 'GitHub personal-access token / OAuth token / app token.',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,255}\b/g,
    mask: '[REDACTED github-pat]',
  },
  {
    name: 'jwt',
    category: 'secret',
    description: 'JSON Web Token (`eyJ...`).',
    regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    mask: '[REDACTED jwt]',
  },
  {
    name: 'bearer-header',
    category: 'secret',
    description: '`Authorization: Bearer ...` header values.',
    regex: /\bBearer\s+[A-Za-z0-9._-]{16,}\b/gi,
    mask: 'Bearer [REDACTED]',
  },
  {
    name: 'basic-auth',
    category: 'secret',
    description: '`Authorization: Basic ...` header values.',
    regex: /\bBasic\s+[A-Za-z0-9+/=]{16,}\b/gi,
    mask: 'Basic [REDACTED]',
  },
  {
    name: 'private-key-pem',
    category: 'secret',
    description: 'PEM private-key block (`-----BEGIN ... PRIVATE KEY-----`).',
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+?-----END [A-Z ]*PRIVATE KEY-----/g,
    mask: '[REDACTED private-key-pem]',
  },
  {
    name: 'email',
    category: 'pii',
    description: 'RFC-5322-ish email address.',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    mask: '[REDACTED email]',
  },
  {
    name: 'creditcard',
    category: 'pii',
    description:
      'Credit card number (13-19 digits, optional spaces / dashes; Luhn-checked, major-network leading digit 2-6; decimal-adjacent digit runs are skipped).',
    // The lookarounds keep serialized decimals intact: `(?<!\.)` refuses a
    // run that continues a fractional part (`0.01639344262295082`) and
    // `(?!\.\d)` refuses the integer part of a decimal (`4111111111119.75`).
    regex: /\b(?<!\.)(?:\d[\s-]*?){13,19}\b(?!\.\d)/g,
    mask: '[REDACTED creditcard]',
    // RP-21: require a valid Luhn checksum + plausible network prefix so a
    // 13-19 digit run that is not a real PAN (millisecond epoch timestamps,
    // order numbers, …) is left alone.
    verify: isLikelyPan,
  },
  {
    name: 'us-ssn',
    category: 'pii',
    description: 'US Social Security Number (`123-45-6789`).',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    mask: '[REDACTED us-ssn]',
  },
  {
    name: 'phone-e164',
    category: 'pii',
    description: 'E.164 phone number (`+11234567890`).',
    regex: /\+\d{7,15}\b/g,
    mask: '[REDACTED phone-e164]',
  },
  {
    name: 'iban',
    category: 'pii',
    description: 'IBAN (2-letter country + 2 check digits + up to 30 alphanumerics).',
    regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
    mask: '[REDACTED iban]',
  },
  {
    name: 'ipv4',
    category: 'pii',
    description: 'IPv4 dotted-quad address. Opt-in (often appears legitimately in logs).',
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    mask: '[REDACTED ipv4]',
    optIn: true,
  },
  {
    name: 'ipv6',
    category: 'pii',
    description: 'IPv6 address (full / compressed). Opt-in.',
    regex: /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g,
    mask: '[REDACTED ipv6]',
    optIn: true,
  },
];

/**
 * The 14 default-on built-in patterns (the IPv4 and IPv6 detectors are
 * opt-in and live in {@link OPT_IN_PATTERNS}).
 *
 * @stable
 */
export const BUILT_IN_PATTERNS: readonly RedactionPattern[] = PATTERNS.filter(
  (p) => p.optIn !== true,
);

/**
 * Patterns that are recognised by the validator but are NOT enabled by
 * default. Use them via `patterns: [...BUILT_IN_PATTERNS, ...OPT_IN_PATTERNS]`.
 *
 * @stable
 */
export const OPT_IN_PATTERNS: readonly RedactionPattern[] = PATTERNS.filter(
  (p) => p.optIn === true,
);

/**
 * Full registry - for tooling that wants to introspect every pattern
 * the framework knows about (e.g. CLI `graphorin redaction list`).
 *
 * @stable
 */
export const ALL_BUILT_IN_PATTERNS: readonly RedactionPattern[] = PATTERNS;

/** JSON insignificant whitespace (RFC 8259). */
const JSON_WS = new Set([' ', '\t', '\n', '\r']);

/**
 * Grammar-preserving mask placement. When the matched span occupies a bare
 * JSON *value* position - the nearest non-whitespace neighbour on the left
 * is `:` / `,` / `[` (or the start of the text) and on the right `,` / `}`
 * / `]` (or the end of the text) - the mask is returned wrapped in double
 * quotes, so masking a raw numeric leaf (`{"card":4111111111111111}`)
 * yields a document that still parses (`{"card":"[REDACTED creditcard]"}`).
 * Everywhere else (prose, CSV, inside a JSON string leaf) the mask is
 * returned unchanged. The text is never parsed, so numeric lexemes outside
 * the match keep their exact source form.
 *
 * @stable
 */
export function jsonSafeMask(
  source: string,
  matchIndex: number,
  matchLength: number,
  mask: string,
): string {
  let i = matchIndex - 1;
  while (i >= 0 && JSON_WS.has(source[i] as string)) i -= 1;
  const left = i < 0 ? undefined : source[i];
  if (!(left === undefined || left === ':' || left === ',' || left === '[')) return mask;
  let j = matchIndex + matchLength;
  while (j < source.length && JSON_WS.has(source[j] as string)) j += 1;
  const right = j >= source.length ? undefined : source[j];
  if (!(right === undefined || right === ',' || right === '}' || right === ']')) return mask;
  return `"${mask}"`;
}

/**
 * Verifier for the `creditcard` pattern: Luhn checksum + leading digit of a
 * major card network (2 = Mir / Mastercard 2-series, 3 = JCB / Amex /
 * Diners, 4 = Visa, 5 = Mastercard / Maestro, 6 = Discover / UnionPay /
 * RuPay). Runs leading with 0 / 1 / 7 / 8 / 9 are never consumer PANs in
 * practice (epoch timestamps and snowflake ids start with 1) - the rare
 * exceptions (UATP `1...`, petroleum `7...`, RuPay `81/82`, Troy `9792`)
 * are deliberately outside the built-in catalogue; register a custom
 * pattern to cover them.
 */
function isLikelyPan(value: string): boolean {
  const lead = value.charCodeAt(0) - 48; // matches always start with a digit
  if (lead < 2 || lead > 6) return false;
  return isLuhnValid(value);
}

/**
 * Luhn (mod-10) checksum validator used by the `creditcard` pattern.
 * Strips spaces / dashes, bounds the length to 13-19 digits, and verifies the
 * checksum so a digit run that merely *looks* like a PAN is not redacted.
 */
function isLuhnValid(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48; // '0'
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}
