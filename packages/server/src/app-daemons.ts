/**
 * Daemon construction for `createServer({...})` - wraps the caller's
 * triggers scheduler / consolidator surfaces in their daemon adapters.
 * Start/stop sequencing stays in `app-lifecycle.ts` because the order
 * relative to the listener is part of the lifecycle contract.
 *
 * @packageDocumentation
 */

import type { ConsolidatorDaemon, ConsolidatorLike } from './consolidator/daemon.js';
import { createConsolidatorDaemon } from './consolidator/daemon.js';
import type { TriggersDaemon } from './triggers/daemon.js';
import { createTriggersDaemon } from './triggers/daemon.js';

/**
 * Discriminated union accepted by `CreateServerOptions.triggers`. A
 * caller may either supply a fully-built daemon (e.g. constructed
 * around a custom `Scheduler`) or just the underlying scheduler - the
 * server wraps it with {@link createTriggersDaemon} automatically.
 *
 * @stable
 */
export type TriggersDaemonInput =
  | { readonly daemon: TriggersDaemon }
  | { readonly scheduler: import('@graphorin/triggers').Scheduler };

/** Subset of `CreateServerOptions` consumed by {@link buildDaemons}. */
export interface BuildDaemonsOptions {
  readonly triggers?: TriggersDaemonInput | undefined;
  readonly consolidator?: ConsolidatorLike | undefined;
}

/** Daemon handles constructed (or adopted) by {@link buildDaemons}. */
export interface BuiltDaemons {
  readonly triggersDaemon: TriggersDaemon | undefined;
  readonly consolidatorDaemon: ConsolidatorDaemon | undefined;
}

/**
 * Wrap the operator-supplied triggers / consolidator surfaces in their
 * daemon adapters. Pure construction - nothing is started here.
 */
export function buildDaemons(options: BuildDaemonsOptions): BuiltDaemons {
  let triggersDaemon: TriggersDaemon | undefined;
  if (options.triggers !== undefined) {
    if ('daemon' in options.triggers) {
      triggersDaemon = options.triggers.daemon;
    } else {
      triggersDaemon = createTriggersDaemon({ scheduler: options.triggers.scheduler });
    }
  }
  let consolidatorDaemon: ConsolidatorDaemon | undefined;
  if (options.consolidator !== undefined) {
    consolidatorDaemon = createConsolidatorDaemon({ consolidator: options.consolidator });
  }
  return { triggersDaemon, consolidatorDaemon };
}
