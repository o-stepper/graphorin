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
export {
  buildExpansionRequest,
  buildHydeRequest,
  createProviderQueryTransformer,
  DEFAULT_MAX_QUERY_VARIANTS,
  HYDE_SYSTEM_PROMPT,
  parseHypothetical,
  parseQueryVariants,
  QUERY_EXPANSION_SYSTEM_PROMPT,
  type QueryTransformer,
  type QueryTransformOptions,
} from './query-transform.js';
export { fuseRrf, fuseWeighted, RRF_DEFAULT_K, RRFReranker, WeightedRRFReranker } from './rrf.js';
export type { ReRanker, ReRankOptions } from './types.js';
