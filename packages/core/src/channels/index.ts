/**
 * Workflow channel kinds + control-flow primitives.
 *
 * Names are Graphorin's own design (`Directive`, `Dispatch`, `pause`,
 * `LatestValue`, `Reducer`, `Stream`, `Barrier`, `Ephemeral`, `AnyValue`)
 * and must not be aliased to terms from other workflow libraries.
 *
 * @packageDocumentation
 */

export type {
  AnyValue,
  Barrier,
  Channel,
  ChannelKind,
  Ephemeral,
  LatestValue,
  ListAggregate,
  Reducer,
  Stream,
} from './channels.js';
export {
  anyValue,
  barrier,
  ephemeral,
  latestValue,
  listAggregate,
  reducer,
  stream,
} from './channels.js';

export type { DirectiveOptions } from './directive.js';
export { Directive } from './directive.js';

export { Dispatch, dispatch } from './dispatch.js';
export type { PauseResumeScope } from './pause.js';
export {
  isPauseSignal,
  PAUSE_SIGNAL_BRAND,
  PauseSignal,
  pause,
  runWithPauseResume,
} from './pause.js';
