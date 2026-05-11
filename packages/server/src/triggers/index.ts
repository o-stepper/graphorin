/**
 * `@graphorin/server/triggers` — daemon + REST routes for the
 * triggers scheduler. Phase 14c surface.
 *
 * @packageDocumentation
 */

export {
  type CreateTriggersDaemonOptions,
  createTriggersDaemon,
  defaultCatchupPolicy,
  type TriggersDaemon,
  type TriggersDaemonMetrics,
  type TriggersDaemonStatus,
} from './daemon.js';
export { createTriggersRoutes, type TriggersRoutesDeps } from './routes.js';
