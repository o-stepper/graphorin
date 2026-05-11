/**
 * `@graphorin/server/metrics` — Phase 14c Prometheus exposition layer.
 *
 * @packageDocumentation
 */

export { createServerMetricRegistry, SERVER_METRIC_NAMES } from './catalog.js';
export {
  type LabelSet,
  type MetricKind,
  MetricRegistry,
} from './registry.js';
