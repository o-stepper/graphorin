/**
 * Dataset loaders. Every loader returns a fully-materialised
 * {@link Dataset} that the runner can iterate over without further
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
  type FromTracesOptions,
  groupAndExtract,
  loadDatasetFromTraces,
  type TraceEvent,
} from './from-traces.js';
export { fromIterable } from './iterable.js';
export {
  type LoadJsonlOptions,
  loadJsonlDataset,
  parseJsonl,
} from './jsonl.js';
