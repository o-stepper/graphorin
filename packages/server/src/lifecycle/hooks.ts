/**
 * Lifecycle hook contract used by `createServer({...})`. Hooks fire
 * in the documented order:
 *
 *   beforeStart -> pre-bind -> migrations -> bind -> onReady
 *
 * On shutdown:
 *
 *   SIGTERM -> beforeShutdown -> drain -> onError? -> exit
 *
 * @packageDocumentation
 */

import type { ServerConfigSpec } from '../config.js';

/**
 * Snapshot passed to {@link LifecycleHooks.beforeStart}.
 *
 * @stable
 */
export interface BeforeStartContext {
  readonly config: ServerConfigSpec;
}

/**
 * Snapshot passed to {@link LifecycleHooks.onReady}.
 *
 * @stable
 */
export interface OnReadyContext {
  readonly config: ServerConfigSpec;
  readonly listeningOn: { readonly host: string; readonly port: number };
}

/**
 * Snapshot passed to {@link LifecycleHooks.beforeShutdown}.
 *
 * @stable
 */
export interface BeforeShutdownContext {
  readonly config: ServerConfigSpec;
  readonly inflight: number;
  readonly drainTimeoutMs: number;
}

/**
 * Snapshot passed to {@link LifecycleHooks.onError}. Errors raised
 * outside the request hot path (lifecycle, audit append, etc.) flow
 * here so operators can fan them into Sentry / Datadog / etc.
 *
 * @stable
 */
export interface OnErrorContext {
  readonly error: unknown;
  readonly phase: 'beforeStart' | 'onReady' | 'beforeShutdown' | 'request' | 'background';
}

/**
 * @stable
 */
export interface LifecycleHooks {
  readonly beforeStart?: (ctx: BeforeStartContext) => void | Promise<void>;
  readonly onReady?: (ctx: OnReadyContext) => void | Promise<void>;
  readonly beforeShutdown?: (ctx: BeforeShutdownContext) => void | Promise<void>;
  readonly onError?: (ctx: OnErrorContext) => void | Promise<void>;
}
