/**
 * Imperative-pattern catalogue for inbound prompt-injection defence.
 *
 * Sibling to {@link BUILT_IN_PATTERNS} (PII / secrets) - the two
 * catalogues are disjoint by construction. The imperative catalogue
 * is consumed by the inbound sanitization layer in `@graphorin/tools`
 * to scan tool / MCP results before they reach the agent's message
 * store; the PII / secrets catalogue is consumed by the outbound
 * exporter validators to scan span attributes before they reach an
 * exporter.
 *
 * The patterns target the canonical English "ignore previous
 * instructions" / "system override" injection family - the concrete
 * surface that an untrusted-skill or MCP server result might use to
 * smuggle imperative content into the next provider call. The
 * catalogue is intentionally conservative: every entry has a fixed-
 * substring prefilter so the per-byte scan budget stays sub-millisecond
 * on typical 16 KB tool results.
 *
 * @packageDocumentation
 */

/**
 * Stable name of an imperative pattern. The catalogue is curated;
 * user-supplied patterns can use any identifier they want and will be
 * passed through the sanitization layer alongside the built-ins.
 *
 * @stable
 */
export type ImperativePatternName =
  | 'ignore-previous-instructions'
  | 'forget-instructions'
  | 'override-instructions'
  | 'system-prompt-leak'
  | 'role-reassignment'
  | 'developer-mode'
  | 'jailbreak-marker'
  | 'tool-call-injection'
  | 'role-tag-injection'
  | 'untrusted-content-delimiter-injection';

/**
 * One entry in the imperative-pattern catalogue. The shape mirrors
 * {@link BUILT_IN_PATTERNS} so consumers can share scan / replace
 * machinery, but the fields are typed as imperative-only so the two
 * catalogues do not accidentally merge.
 *
 * @stable
 */
export interface ImperativePattern {
  readonly name: ImperativePatternName | (string & {});
  readonly description: string;
  /**
   * Cheap substring prefilter applied before the regex; if the body
   * does not contain any of the prefilter substrings the regex is
   * skipped entirely. The prefilter is case-insensitive.
   */
  readonly prefilter: ReadonlyArray<string>;
  /**
   * Full regex applied when the prefilter matches. Always carries the
   * `g` and `i` flags; the catalogue construction validates this.
   */
  readonly regex: RegExp;
  /** Replacement string applied by the `'detect-and-strip*'` policies. */
  readonly mask: string;
}

const PATTERNS: readonly ImperativePattern[] = [
  {
    name: 'ignore-previous-instructions',
    description:
      'The canonical "ignore previous instructions" injection - the most common form of prompt injection seen across MCP results.',
    prefilter: ['ignore', 'disregard', 'forget'],
    regex:
      /\b(?:ignore|disregard|forget)\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|above|earlier|preceding|original)\s+(?:instructions?|prompts?|messages?|directives?|rules?)\b/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
  {
    name: 'forget-instructions',
    description: 'Imperative "forget what I told you" / memory-wipe family.',
    prefilter: ['forget', 'erase', 'clear'],
    regex:
      /\b(?:forget|erase|clear|wipe)\s+(?:everything|all)\s+(?:above|before|previous|i\s+(?:told|said))\b/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
  {
    name: 'override-instructions',
    description: '"Override the system prompt" / "new instructions" injection family.',
    prefilter: ['override', 'new instructions', 'updated instructions', 'replace'],
    regex:
      /\b(?:override|replace)\s+(?:the\s+)?(?:system\s+)?(?:prompt|instructions?|directives?)\b|\bnew\s+(?:instructions?|prompts?|directives?)\s*(?::|follow|are)\b|\bupdated\s+(?:instructions?|prompts?|directives?)\b/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
  {
    name: 'system-prompt-leak',
    description:
      'Requests asking the model to reveal its system prompt / hidden instructions / configuration.',
    prefilter: ['system prompt', 'system message', 'reveal', 'print', 'show'],
    regex:
      /\b(?:reveal|print|show|output|repeat|expose|disclose)\s+(?:your|the)\s+(?:system\s+(?:prompt|message|instructions?)|hidden\s+instructions?|initial\s+(?:prompt|instructions?)|configuration)\b/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
  {
    name: 'role-reassignment',
    description: '"You are now ..." / role-reassignment imperative family.',
    prefilter: ['you are now', 'you are no longer', 'pretend', 'act as'],
    regex:
      /\byou\s+are\s+(?:now|no\s+longer)\s+(?:a\b|an\b|the\b)|\bpretend\s+(?:to\s+be|you\s+are)\b|\bact\s+as\s+(?:a|an|the|if\s+you)\b/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
  {
    name: 'developer-mode',
    description:
      'Requests to enter "developer mode" / "DAN" / unrestricted modes - a long-running jailbreak family.',
    prefilter: ['developer mode', 'admin mode', 'unrestricted'],
    regex:
      /\b(?:enter|enable|activate)\s+(?:developer|admin|debug|unrestricted|god|root)\s+mode\b/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
  {
    name: 'jailbreak-marker',
    description: 'Direct "jailbreak" markers in tool result content.',
    prefilter: ['jailbreak', 'jailbroken'],
    regex: /\bjailbroken?\s+(?:mode|response|model|assistant)\b/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
  {
    name: 'tool-call-injection',
    description:
      'Tool-call markers that try to coerce the model into invoking a tool from the result content.',
    prefilter: ['<tool_use', '<function_call', '<invoke'],
    regex: /<(?:tool_use|function_call|invoke|tool_call)\b[^>]*>/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
  {
    name: 'role-tag-injection',
    description:
      'Chat-role tags injected into tool results to spoof a system / assistant message in the conversation.',
    prefilter: ['<|im_start|', '<|system|', '<|assistant|', '<|user|'],
    regex: /<\|(?:im_start|system|assistant|user|im_end)\|>/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
  {
    name: 'untrusted-content-delimiter-injection',
    description:
      'Fabricated `<<<untrusted_content>>>` envelope delimiters inside untrusted content - an attempt to prematurely close, or spoof a nested opening of, the inbound trust envelope. The regex is scoped STRICTLY to the envelope markers (never bare `<<<` / `>>>` runs) so legitimate Python doctest / REPL `>>>` and shell heredoc fragments are untouched.',
    // The word alone is the prefilter: any marker form the regex can
    // match necessarily contains it, including whitespace-padded
    // variants like `<<< untrusted_content` that a tighter
    // `<<<untrusted_content` prefilter would miss.
    prefilter: ['untrusted_content'],
    regex: /<<<\s*\/?\s*untrusted_content/gi,
    mask: '[REDACTED:imperative-pattern]',
  },
];

/**
 * The default-on imperative-pattern catalogue. Stable across patches;
 * additions during the pre-1.0 window are minor-bumps because new
 * patterns may produce additional `tool.inbound.sanitization.hit{...}`
 * counter increments on existing deployments.
 *
 * @stable
 */
export const BUILT_IN_IMPERATIVE_PATTERNS: readonly ImperativePattern[] = PATTERNS;

/**
 * Combined Aho-Corasick-style prefilter set across every pattern.
 * Lower-cased substrings; consumers test the body once with the
 * combined filter before iterating regexes.
 *
 * @stable
 */
export const IMPERATIVE_PREFILTER_SUBSTRINGS: ReadonlyArray<string> = Object.freeze([
  ...new Set(BUILT_IN_IMPERATIVE_PATTERNS.flatMap((p) => p.prefilter.map((s) => s.toLowerCase()))),
]);

/**
 * Compiled scan helper. Returns the list of pattern names that fired
 * AND the number of bytes the strip would remove if applied. Bounded
 * by the budget hint - when exceeded, returns `null` to let the caller
 * apply the best-effort `'detect-failed'` annotation.
 *
 * @stable
 */
export interface ScanResult {
  readonly hits: ReadonlyArray<{ readonly pattern: string; readonly matchCount: number }>;
  readonly bytesMatched: number;
  readonly scanDurationUs: number;
}

/**
 * Run the imperative-pattern scan against `body`. Patterns are
 * iterated in catalogue order; the prefilter shortcut returns early
 * for bodies that do not contain any imperative-family substring.
 *
 * @stable
 */
export function scanImperativePatterns(
  body: string,
  patterns: ReadonlyArray<ImperativePattern> = BUILT_IN_IMPERATIVE_PATTERNS,
  budgetMs = 5,
): ScanResult | null {
  const start = performance.now();
  if (body.length === 0) {
    return { hits: [], bytesMatched: 0, scanDurationUs: 0 };
  }
  const lower = body.toLowerCase();
  let prefilterHit = false;
  for (const sub of IMPERATIVE_PREFILTER_SUBSTRINGS) {
    if (lower.includes(sub)) {
      prefilterHit = true;
      break;
    }
  }
  if (!prefilterHit) {
    return {
      hits: [],
      bytesMatched: 0,
      scanDurationUs: Math.round((performance.now() - start) * 1000),
    };
  }
  const hits: { pattern: string; matchCount: number }[] = [];
  let bytesMatched = 0;
  for (const pattern of patterns) {
    if (performance.now() - start > budgetMs) return null;
    const localPrefilterMatch = pattern.prefilter.some((sub) => lower.includes(sub.toLowerCase()));
    if (!localPrefilterMatch) continue;
    let matchCount = 0;
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null = pattern.regex.exec(body);
    while (match !== null) {
      matchCount++;
      bytesMatched += match[0].length;
      if (pattern.regex.lastIndex === match.index) {
        pattern.regex.lastIndex = match.index + 1;
      }
      match = pattern.regex.exec(body);
    }
    if (matchCount > 0) {
      hits.push({ pattern: pattern.name as string, matchCount });
    }
  }
  return {
    hits,
    bytesMatched,
    scanDurationUs: Math.round((performance.now() - start) * 1000),
  };
}

/**
 * Apply `pattern.mask` to every match of every pattern in `body`. Used
 * by the `'detect-and-strip*'` policies. The mask is calibrated to NOT
 * match any imperative pattern itself, so post-strip bodies do not
 * trigger another scan hit on round trips.
 *
 * @stable
 */
export function stripImperativePatterns(
  body: string,
  patterns: ReadonlyArray<ImperativePattern> = BUILT_IN_IMPERATIVE_PATTERNS,
): string {
  let out = body;
  for (const pattern of patterns) {
    out = out.replace(pattern.regex, pattern.mask);
  }
  return out;
}
