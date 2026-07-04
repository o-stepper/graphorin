/**
 * @graphorin/evals — eval framework for the Graphorin framework.
 *
 * Builds on the eval primitives shipped from `@graphorin/observability`
 * (RB-17 / DEC-152) — full orchestrator lives here, post-MVP, decoupled
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
 *   agent,
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

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.5.0';

export {
  detectRegressions,
  exitOnFailures,
  type ReporterFormat,
  type WriteReportsOptions,
  type WrittenReport,
  writeReports,
} from './cli/index.js';
export type {
  FromTracesOptions,
  LoadDmrOptions,
  LoadLocomoOptions,
  LoadLongMemEvalOptions,
  MemoryEvalAbility,
  MemoryEvalInput,
  MemoryEvalSession,
  MemoryEvalTurn,
  TraceEvent,
} from './loaders/index.js';
export {
  fromIterable,
  type LoadCsvOptions,
  type LoadJsonlOptions,
  loadCsvDataset,
  loadDatasetFromTraces,
  loadDmrDataset,
  loadJsonlDataset,
  loadLocomoDataset,
  loadLongMemEvalDataset,
  parseCsv,
  parseDmr,
  parseJsonl,
  parseLocomo,
  parseLongMemEval,
} from './loaders/index.js';
export { detectRegressions as detectRegressionsFromReports } from './regression.js';
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
export {
  renderHtmlReport,
  renderJsonReport,
  renderJunitReport,
  renderMarkdownReport,
  renderTerminalReport,
} from './reporters/index.js';
export { runEvals } from './runner.js';
export {
  type ArgumentValidityOptions,
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
  toxicityScorer,
} from './scorers/index.js';
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
