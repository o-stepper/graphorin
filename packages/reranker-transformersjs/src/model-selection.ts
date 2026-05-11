/**
 * Locale-aware default model selector. Mirrors ADR-024 / DEC-120 § BGE
 * model family:
 *
 *  - English-only deployments → `Xenova/bge-reranker-base` (278M, FP16).
 *  - Every other locale → `BAAI/bge-reranker-v2-m3` (568M, multilingual).
 *
 * The selector deliberately stays language-pair-agnostic outside the
 * English fast path; operators that want a narrower / language-specific
 * cross-encoder pass an explicit `model` to {@link
 * createCrossEncoderReranker}.
 *
 * @packageDocumentation
 */

/**
 * BCP 47 locale tag (e.g. `'en'`, `'en-GB'`, `'pt-BR'`, `'zh-Hans-CN'`).
 *
 * @stable
 */
export type LocaleTag = string;

/** @stable */
export const DEFAULT_ENGLISH_MODEL = 'Xenova/bge-reranker-base';
/** @stable */
export const DEFAULT_MULTILINGUAL_MODEL = 'BAAI/bge-reranker-v2-m3';

/**
 * Pick a reranker model from the agent locale. Pure function so callers
 * (and tests) can pre-resolve the choice without constructing the
 * reranker.
 *
 * @stable
 */
export function pickRerankerModel(locale: LocaleTag | undefined): string {
  if (locale === undefined || locale.length === 0) return DEFAULT_MULTILINGUAL_MODEL;
  const normalized = locale.toLowerCase();
  if (normalized === 'en' || normalized.startsWith('en-')) return DEFAULT_ENGLISH_MODEL;
  return DEFAULT_MULTILINGUAL_MODEL;
}
