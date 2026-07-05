/**
 * `@graphorin/server/health` - Phase 14c health + Prometheus metrics
 * surface. Phase 14a's `/v1/health` is superseded by the extended
 * routes built here when consumers wire the additional probes.
 *
 * @packageDocumentation
 */

export {
  type BaseHealthCheck,
  type ConsolidatorCheck,
  collectHealth,
  type EmbedderCheck,
  type EncryptionCheck,
  type HealthCheck,
  type HealthCheckOptions,
  type HealthChecks,
  type HealthRollup,
  type HealthStatus,
  type HealthSummary,
  type ReplayBufferCheck,
  type ReplayBufferProbe,
  rollup,
  type SecretsCheck,
  type StorageCheck,
  type TriggersCheck,
} from './checks.js';
export {
  createExtendedHealthRoutes,
  createMetricsRoutes,
  createSecretsHealthRoutes,
  type HealthRouteOptions,
  type MetricsRoutesOptions,
} from './routes.js';
