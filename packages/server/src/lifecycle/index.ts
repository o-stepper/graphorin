/**
 * Public lifecycle surface for `@graphorin/server`. Re-exports the
 * hook contract + the pre-bind helper so consumers can wire bespoke
 * lifecycles around the standard server.
 *
 * @packageDocumentation
 */

export type {
  BeforeShutdownContext,
  BeforeStartContext,
  LifecycleHooks,
  OnErrorContext,
  OnReadyContext,
} from './hooks.js';
export { type PreBindResult, type RunPreBindOptions, runPreBind } from './pre-bind.js';
