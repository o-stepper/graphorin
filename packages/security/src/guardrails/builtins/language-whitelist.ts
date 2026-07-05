/**
 * `languageWhitelist` - block when the input is not in the operator's
 * allowed-language list. Uses a hand-rolled n-gram-style scoring
 * function so the security package does not pull a third-party
 * language detector. The detector is intentionally conservative: when
 * the score is ambiguous, the guardrail returns `ok: true` to avoid
 * false positives - operators who need stricter detection should
 * inject a custom `detectLanguage(...)` callback.
 *
 * Coverage out-of-the-box: English (`'en'`), Russian (`'ru'`),
 * Ukrainian (`'uk'`), German (`'de'`), French (`'fr'`), Spanish
 * (`'es'`), Italian (`'it'`), Portuguese (`'pt'`), Polish (`'pl'`),
 * Czech (`'cs'`). Every other language returns `'unknown'`.
 *
 * Reference: the project's security architecture, § Guardrails.
 *
 * @packageDocumentation
 */

import { defineInputGuardrail } from '../builders.js';
import type { GuardrailResult, InputGuardrail } from '../types.js';

/**
 * Stable language codes the built-in detector recognises.
 *
 * @stable
 */
export type DetectedLanguage =
  | 'en'
  | 'ru'
  | 'uk'
  | 'de'
  | 'fr'
  | 'es'
  | 'it'
  | 'pt'
  | 'pl'
  | 'cs'
  | 'unknown';

/**
 * Options for `languageWhitelist(...)`.
 *
 * @stable
 */
export interface LanguageWhitelistOptions {
  readonly allowed: ReadonlyArray<DetectedLanguage>;
  /**
   * Override the built-in detector. Useful when the deployment ships
   * a more accurate detector (e.g. CLD3 via FFI).
   */
  readonly detect?: (text: string) => DetectedLanguage;
  /** Action on rejection. Defaults to `'block'`. */
  readonly action?: 'block' | 'warn';
  /** Override guardrail name. */
  readonly name?: string;
  /**
   * Treat `'unknown'` as accepted. Defaults to `true` so the
   * guardrail does not over-block multilingual input.
   */
  readonly acceptUnknown?: boolean;
}

/**
 * Construct the language-whitelist guardrail.
 *
 * @stable
 */
export function languageWhitelist<TValue = unknown>(
  opts: LanguageWhitelistOptions,
): InputGuardrail<TValue> {
  const allowed = new Set(opts.allowed);
  const action = opts.action ?? 'block';
  const acceptUnknown = opts.acceptUnknown ?? true;
  const detect = opts.detect ?? detectLanguage;
  const name = opts.name ?? 'languageWhitelist';

  return defineInputGuardrail<TValue>({
    name,
    check: (value: TValue): GuardrailResult<TValue> => {
      const text = textOf(value).trim();
      if (text.length === 0) return { ok: true };
      const lang = detect(text);
      if (lang === 'unknown' && acceptUnknown) return { ok: true };
      if (allowed.has(lang)) return { ok: true };
      return {
        ok: false,
        action,
        message: `detected language ${lang} is not in the allowed list`,
        metadata: Object.freeze({ detected: lang, allowed: [...allowed] }),
      };
    },
  });
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(textOf).join('\n');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Default language detector. The detector scores text by:
 *
 *  - The proportion of ASCII vs Cyrillic / extended-Latin
 *    characters; tells English / Russian / Ukrainian apart from
 *    Latin-but-not-English families.
 *  - A small, well-known stopword list per language; the language
 *    with the highest stopword hit count wins.
 *
 * The detector returns `'unknown'` when no signal exceeds a
 * conservative threshold. Operators who need higher accuracy should
 * override `detect`.
 *
 * @stable
 */
export function detectLanguage(text: string): DetectedLanguage {
  const lower = text.toLowerCase();
  const cyrillic = (lower.match(/[\u0400-\u04FF]/g) ?? []).length;
  const total = lower.replace(/\s+/g, '').length;
  if (total === 0) return 'unknown';

  if (cyrillic > total * 0.3) {
    return scoreCyrillic(lower);
  }

  return scoreLatin(lower);
}

function scoreCyrillic(text: string): DetectedLanguage {
  const ru = countAny(text, ['это', 'нет', 'что', 'как', 'для', 'или', 'мы', 'вы', 'но', 'весь']);
  const uk = countAny(text, [
    'це',
    'не',
    'що',
    'як',
    'для',
    'або',
    'ми',
    'ви',
    'але',
    'все',
    'ї',
    'є',
  ]);
  if (uk > ru) return 'uk';
  if (ru > 0) return 'ru';
  return 'unknown';
}

function scoreLatin(text: string): DetectedLanguage {
  const candidates: ReadonlyArray<{ lang: DetectedLanguage; words: ReadonlyArray<string> }> = [
    { lang: 'en', words: ['the', 'and', 'is', 'are', 'of', 'to', 'in', 'that', 'it'] },
    { lang: 'de', words: ['der', 'die', 'und', 'ist', 'nicht', 'ein', 'eine', 'zu', 'mit'] },
    { lang: 'fr', words: ['le', 'la', 'les', 'et', 'est', 'pas', 'un', 'une', 'avec'] },
    { lang: 'es', words: ['el', 'la', 'los', 'las', 'y', 'es', 'no', 'una', 'con'] },
    { lang: 'it', words: ['il', 'la', 'gli', 'e', 'è', 'non', 'una', 'con', 'sono'] },
    { lang: 'pt', words: ['o', 'a', 'os', 'as', 'e', 'é', 'não', 'um', 'uma', 'com'] },
    { lang: 'pl', words: ['i', 'jest', 'nie', 'to', 'na', 'w', 'z', 'się', 'że'] },
    { lang: 'cs', words: ['a', 'je', 'není', 'to', 'na', 'v', 'se', 'že', 'také'] },
  ];
  let best: { lang: DetectedLanguage; score: number } = { lang: 'unknown', score: 0 };
  for (const c of candidates) {
    const score = countAny(text, c.words);
    if (score > best.score) best = { lang: c.lang, score };
  }
  return best.score >= 2 ? best.lang : 'unknown';
}

function countAny(text: string, words: ReadonlyArray<string>): number {
  let count = 0;
  for (const w of words) {
    // Use Unicode-aware lookarounds so the boundary recognises
    // non-Latin word characters (Cyrillic, etc.); the default `\b`
    // treats only `[A-Za-z0-9_]` as word characters.
    const re = new RegExp(`(?<!\\p{L})${escapeRegex(w)}(?!\\p{L})`, 'gu');
    const matches = text.match(re);
    if (matches) count += matches.length;
  }
  return count;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
