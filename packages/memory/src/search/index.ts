/**
 * Hybrid search composition for `@graphorin/memory`. Owns the
 * `ReRanker` contract and the built-in `RRFReranker` (k=60 default).
 *
 * @packageDocumentation
 */

export {
  explainRecall,
  formatRecallExplanation,
  type RecallExplanation,
  type RecalledMemoryExplanation,
} from './explain.js';
export { fuseRrf, RRF_DEFAULT_K, RRFReranker } from './rrf.js';
export type { ReRanker, ReRankOptions } from './types.js';
