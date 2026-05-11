/**
 * In-process counter registry for `@graphorin/tools` metrics.
 *
 * Mirrors the discipline used by `@graphorin/observability`'s
 * redaction counters: counters are kept in memory, exposed through
 * `snapshot()` for export to Prometheus / OpenTelemetry by the host
 * application, and reset via `resetCounters()` for test isolation.
 *
 * The counter taxonomy follows a stable prefix-per-RB convention:
 *
 * - `tool.collision.*` (collision detection / resolution)
 * - `tool.inbound.sanitization.*` (inbound prompt-injection scan)
 * - `tool.result.*` (truncation / spill)
 * - `tool.retrieval.*` (deferred-loading / `tool_search`)
 * - `tool.classification.*` (side-effect classification)
 * - `tool.streaming.*` (streaming-tool execution)
 * - `tool.preferred-model.*` (per-tool model hints)
 * - `tool.executor.*` (general execution counters)
 *
 * Cardinality is bounded — every label is a finite enum or a
 * tool-name (which is per-deployment bounded by the registered
 * catalogue size).
 *
 * @packageDocumentation
 */

const counters = new Map<string, number>();
const histograms = new Map<string, number[]>();

const COUNTER_NAME_PATTERN = /^[a-z][a-z0-9._-]*$/i;

function buildKey(
  name: string,
  labels?: Readonly<Record<string, string | number | boolean>>,
): string {
  if (labels === undefined) return name;
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return name;
  const labelString = keys.map((k) => `${k}=${labels[k]}`).join(',');
  return `${name}{${labelString}}`;
}

/**
 * Increment a counter (or initialise to `1`). Multi-label invocations
 * are keyed by sorted label name + value pairs to keep the snapshot
 * deterministic.
 *
 * @stable
 */
export function incrementCounter(
  name: string,
  labels?: Readonly<Record<string, string | number | boolean>>,
  by = 1,
): void {
  if (!COUNTER_NAME_PATTERN.test(name)) return;
  const key = buildKey(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + by);
}

/**
 * Set a gauge value. Used for one-shot signals like the
 * `tool.result.truncation.first-overrun{toolName}` per-tool flag.
 *
 * @stable
 */
export function setGauge(
  name: string,
  value: number,
  labels?: Readonly<Record<string, string | number | boolean>>,
): void {
  if (!COUNTER_NAME_PATTERN.test(name)) return;
  const key = buildKey(name, labels);
  counters.set(key, value);
}

/**
 * Record an observation in a histogram. Stored as the raw observation
 * list so consumers can compute their own quantiles; the host
 * application is responsible for periodic histogram aggregation.
 *
 * @stable
 */
export function observeHistogram(
  name: string,
  value: number,
  labels?: Readonly<Record<string, string | number | boolean>>,
): void {
  if (!COUNTER_NAME_PATTERN.test(name)) return;
  const key = buildKey(name, labels);
  const observations = histograms.get(key) ?? [];
  observations.push(value);
  histograms.set(key, observations);
}

/**
 * Snapshot of the counter + histogram registry. Returns fresh frozen
 * objects so callers cannot accidentally mutate the registry.
 *
 * @stable
 */
export interface CounterSnapshot {
  readonly counters: Readonly<Record<string, number>>;
  readonly histograms: Readonly<Record<string, ReadonlyArray<number>>>;
}

/**
 * Snapshot the current state of the counter / histogram registry.
 *
 * @stable
 */
export function snapshotCounters(): CounterSnapshot {
  const flatCounters: Record<string, number> = {};
  for (const [k, v] of counters) flatCounters[k] = v;
  const flatHistograms: Record<string, readonly number[]> = {};
  for (const [k, v] of histograms) flatHistograms[k] = Object.freeze([...v]);
  return Object.freeze({
    counters: Object.freeze(flatCounters),
    histograms: Object.freeze(flatHistograms),
  });
}

/**
 * Reset every counter and histogram. Used by tests for isolation.
 *
 * @experimental
 */
export function resetCountersForTesting(): void {
  counters.clear();
  histograms.clear();
}

/**
 * Read a single counter (returns `0` when absent). Used by tests to
 * make assertions on specific counter increments.
 *
 * @experimental
 */
export function getCounterForTesting(
  name: string,
  labels?: Readonly<Record<string, string | number | boolean>>,
): number {
  return counters.get(buildKey(name, labels)) ?? 0;
}

/**
 * Read a single histogram observation list (returns `[]` when absent).
 *
 * @experimental
 */
export function getHistogramForTesting(
  name: string,
  labels?: Readonly<Record<string, string | number | boolean>>,
): readonly number[] {
  return histograms.get(buildKey(name, labels)) ?? [];
}
