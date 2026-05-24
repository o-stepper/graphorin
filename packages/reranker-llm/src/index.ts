/**
 * @graphorin/reranker-llm — LLM-as-reranker adapter for the Graphorin
 * framework.
 *
 * Asks the configured `Provider` to score `(query, passage)` pairs
 * against a deterministic scoring prompt; runs scoring in parallel
 * batches via `Promise.all()`. Drop-in replacement for the built-in
 * `RRFReranker`:
 *
 * ```ts
 * import { createMemory } from '@graphorin/memory';
 * import { createLlmReranker } from '@graphorin/reranker-llm';
 *
 * const memory = createMemory({
 *   store,
 *   embedder,
 *   reranker: createLlmReranker({ provider }),
 * });
 * ```
 *
 * Defaults: `temperature: 0`, `batchSize: 5`, `maxScore: 10`. The
 * default scoring prompt is English; operators that target a
 * different locale pass `scoringPrompt: <localised builder>` per the
 * Phase 16 spec (the package's defaults are locale-agnostic, not
 * locale-privileging).
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.3.0';

export {
  createLlmReranker,
  LlmReRanker,
  type LlmRerankerOptions,
  mergeAndDedupe,
  normalizeScore,
  parseIntegerResponse,
  RERANKER_ID,
} from './reranker.js';
export {
  defaultScoringPrompt,
  type ScoringPrompt,
  type ScoringPromptBuilder,
  type ScoringPromptInput,
} from './scoring-prompt.js';
export {
  defaultPassageExtractor,
  type PassageExtractor,
} from './text-extraction.js';
