/**
 * @graphorin/evals - eval framework for the Graphorin framework.
 *
 * Builds on the eval primitives shipped from `@graphorin/observability`
 * (DEC-152) - full orchestrator lives here, post-MVP, decoupled
 * from the core observability bundle so consumers do not pay the
 * dataset / reporter cost when only the inline runner is needed.
 *
 * ```ts
 * import {
 *   runEvals,
 *   loadJsonlDataset,
 *   exactMatch,
 *   renderTerminalReport,
 *   exitOnFailures,
 * } from '@graphorin/evals';
 *
 * const dataset = await loadJsonlDataset('./fixtures/golden.jsonl');
 * const report = await runEvals({
 *   // A Graphorin `Agent` allows one run in flight per instance, so
 *   // `concurrency > 1` takes a per-worker factory (a shared `agent`
 *   // is fine for objects that tolerate parallel `run()` calls).
 *   agentFactory: () => createAgent(config),
 *   dataset,
 *   scorers: [exactMatch()],
 *   concurrency: 4,
 * });
 * console.log(renderTerminalReport(report));
 * exitOnFailures(report);
 * ```
 *
 * @packageDocumentation
 */

/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };

export const VERSION: string = pkg.version;

export {
  detectRegressions,
  exitOnFailures,
  type ReporterFormat,
  type WriteReportsOptions,
  type WrittenReport,
  writeReports,
} from './cli/index.js';
export { createFakeEmbedder } from './fake-embedder.js';
export type {
  FromTracesOptions,
  HaluMemStage,
  LoadDmrOptions,
  LoadHaluMemOptions,
  LoadLocomoOptions,
  LoadLongMemEvalOptions,
  MemoryEvalAbility,
  MemoryEvalInput,
  MemoryEvalSession,
  MemoryEvalTurn,
  MemoryGoldPoint,
  MemoryOperationKind,
  MemoryOperationsEvalInput,
  MemoryOperationsObservation,
  TraceEvent,
} from './loaders/index.js';
export {
  fromIterable,
  type LoadCsvOptions,
  type LoadJsonlOptions,
  loadCsvDataset,
  loadDatasetFromTraces,
  loadDmrDataset,
  loadHaluMemDataset,
  loadJsonlDataset,
  loadLocomoDataset,
  loadLongMemEvalDataset,
  parseCsv,
  parseDmr,
  parseHaluMem,
  parseJsonl,
  parseLocomo,
  parseLongMemEval,
} from './loaders/index.js';
export { detectRegressions as detectRegressionsFromReports } from './regression.js';
export {
  renderHtmlReport,
  renderJsonReport,
  renderJunitReport,
  renderMarkdownReport,
  renderTerminalReport,
} from './reporters/index.js';
export { EvalConcurrencyError, runEvals } from './runner.js';
export {
  type ArgumentValidityOptions,
  anyMatch,
  argumentValidity,
  type CorrectToolSelectedOptions,
  correctToolSelected,
  type ExactMatchOptions,
  exactMatch,
  type FinalStateCorrectOptions,
  factualityScorer,
  fenceForJudge,
  finalStateCorrect,
  helpfulnessScorer,
  type JsonPathOptions,
  jsonPath,
  type LlmJudgeOptions,
  llmJudge,
  type MemoryPointMatcher,
  type MemoryPointScorerOptions,
  type MemoryQaHallucinationOptions,
  type MemoryUpdateOmissionOptions,
  memoryExtractionPrecision,
  memoryExtractionRecall,
  memoryPointTokens,
  memoryQaHallucination,
  memoryUpdateOmission,
  type PrebuiltScorerOptions,
  type PredicateOptions,
  parseScore,
  predicate,
  type RecoveryAfterErrorOptions,
  type RedundantCallDetectionOptions,
  type RegexMatchOptions,
  recoveryAfterError,
  redundantCallDetection,
  regexMatch,
  scoreContract,
  type Trajectory,
  type TrajectoryToolCall,
  tokenF1,
  tokenF1Matcher,
  toxicityScorer,
} from './scorers/index.js';
export {
  mean,
  type PairedSignificance,
  pairedPassSignificance,
  passByBaseCase,
  passHatK,
  sampleStddev,
  stripIterationSuffix,
  wilsonInterval,
} from './stats.js';
export type {
  AgentLike,
  Case,
  Dataset,
  EvalCaseResult,
  EvalReport,
  ProgressEvent,
  RegressionFinding,
  RegressionOptions,
  RegressionReport,
  RunEvalOptions,
  RunOptions,
  ScoreResult,
  Scorer,
} from './types.js';
