/**
 * Dataset loaders. Every loader returns a fully-materialised
 * `Dataset` that the runner can iterate over without further
 * I/O. Streaming loaders are a post-MVP follow-up.
 *
 * @packageDocumentation
 */

export {
  type LoadCsvOptions,
  loadCsvDataset,
  parseCsv,
} from './csv.js';
export {
  type LoadDmrOptions,
  loadDmrDataset,
  parseDmr,
} from './dmr.js';
export {
  type FromTracesOptions,
  groupAndExtract,
  loadDatasetFromTraces,
  type TraceEvent,
} from './from-traces.js';
export {
  type HaluMemStage,
  type LoadHaluMemOptions,
  loadHaluMemDataset,
  parseHaluMem,
} from './halumem.js';
export { fromIterable } from './iterable.js';
export {
  type LoadJsonlOptions,
  loadJsonlDataset,
  parseJsonl,
} from './jsonl.js';
export {
  type LoadLocomoOptions,
  loadLocomoDataset,
  parseLocomo,
} from './locomo.js';
export {
  type LoadLongMemEvalOptions,
  loadLongMemEvalDataset,
  parseLongMemEval,
} from './longmemeval.js';
export type {
  MemoryEvalAbility,
  MemoryEvalInput,
  MemoryEvalSession,
  MemoryEvalTurn,
  MemoryGoldPoint,
  MemoryOperationKind,
  MemoryOperationsEvalInput,
  MemoryOperationsObservation,
} from './memory-eval.js';
