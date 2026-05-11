/**
 * @graphorin/reranker-transformersjs — cross-encoder reranker adapter
 * for the Graphorin framework.
 *
 * Wraps `@huggingface/transformers@^4.1.0` to score `(query, passage)`
 * pairs in-process. Plug into the memory hybrid-search pipeline as a
 * drop-in replacement for the built-in `RRFReranker`:
 *
 * ```ts
 * import { createMemory } from '@graphorin/memory';
 * import { createCrossEncoderReranker } from '@graphorin/reranker-transformersjs';
 *
 * const memory = createMemory({
 *   store,
 *   embedder,
 *   reranker: createCrossEncoderReranker({ locale: 'en' }),
 * });
 * ```
 *
 * Locale-aware default model:
 *
 *  - `'en'` / `'en-*'` → `Xenova/bge-reranker-base` (278M parameters,
 *    FP16 quantized).
 *  - Every other locale → `BAAI/bge-reranker-v2-m3` (568M parameters,
 *    multilingual baseline).
 *
 * Operators that want a narrower / language-specific cross-encoder
 * pass an explicit `model` option — the package's defaults
 * deliberately avoid privileging any single language pair.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.1.0';

export {
  _resetPipelineFactoryCacheForTesting,
  type ClassifierResult,
  CrossEncoderLoadError,
  type CrossEncoderPipeline,
  type CrossEncoderPipelineFactory,
  extractPairScores,
  loadDefaultPipelineFactory,
  type RerankerDtype,
} from './cross-encoder.js';
export {
  DEFAULT_ENGLISH_MODEL,
  DEFAULT_MULTILINGUAL_MODEL,
  type LocaleTag,
  pickRerankerModel,
} from './model-selection.js';
export {
  type CrossEncoderRerankerOptions,
  createCrossEncoderReranker,
  mergeAndDedupe,
  RERANKER_ID,
  TransformersJsReRanker,
} from './reranker.js';
export {
  defaultPassageExtractor,
  type PassageExtractor,
} from './text-extraction.js';
