/**
 * Operation-level memory scorers (HaluMem-format): deterministic
 * extraction recall / precision and update omission, plus the judged
 * QA hallucination rate. Companion to the `loadHaluMemDataset`
 * loader.
 *
 * @packageDocumentation
 */

export {
  type MemoryPointScorerOptions,
  memoryExtractionPrecision,
  memoryExtractionRecall,
} from './extraction.js';
export {
  type MemoryQaHallucinationOptions,
  memoryQaHallucination,
} from './qa.js';
export {
  type MemoryUpdateOmissionOptions,
  memoryUpdateOmission,
} from './update.js';
export {
  anyMatch,
  defaultMemoryPointMatcher,
  goldCoverageMatcher,
  goldTokenCoverage,
  type MemoryPointMatcher,
  memoryPointTokens,
  tokenF1,
  tokenF1Matcher,
} from './util.js';
