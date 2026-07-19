/**
 * Bridge the `@graphorin/tools` module-level counter registry
 * (which `@graphorin/mcp` also writes) into the server's
 * {@link MetricRegistry}, so `tool.*` / `mcp.*` telemetry - including
 * the shadow-mode `tool.dataflow.*` counters - shows up on
 * `/v1/metrics` without hand-wiring.
 *
 * Called from `refreshLiveMetrics` on every scrape. Counters are
 * delta-synced (the tools registry is cumulative per process; the
 * Prometheus registry increments by the positive difference, so
 * repeated scrapes never double-count); gauges are set absolutely -
 * the `kinds` field on the snapshot (added for exactly this bridge)
 * tells the two apart. Histograms are deliberately NOT bridged yet:
 * summary bridging needs per-key consumed-observation offsets, and the
 * raw observation lists stay available through `snapshotCounters()`
 * for library users (documented in the observability guide).
 *
 * Naming: `tool.executor.retry.total{toolName=x}` becomes
 * `graphorin_tool_executor_retry_total{toolName="x"}` - `[.-]` map to
 * `_` (the Prometheus name grammar forbids dots), label values pass
 * through the same sanitizer as trigger ids.
 *
 * @packageDocumentation
 */

import { type CounterSnapshot, snapshotCounters } from '@graphorin/tools/audit';
import type { MetricRegistry } from './registry.js';

const BRIDGED_PREFIXES = ['tool.', 'mcp.'] as const;
const PROM_LABEL_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Sync the tools-package counter snapshot into `registry`. Idempotent
 * per value: scraping twice without new increments changes nothing.
 *
 * @stable
 */
export function syncToolCounters(
  registry: MetricRegistry,
  snapshot: CounterSnapshot = snapshotCounters(),
): void {
  for (const [key, value] of Object.entries(snapshot.counters)) {
    const parsed = parseCounterKey(key);
    if (parsed === undefined) continue;
    if (!BRIDGED_PREFIXES.some((prefix) => parsed.name.startsWith(prefix))) continue;
    const kind = snapshot.kinds[key] ?? 'counter';
    const metricName = toPrometheusName(parsed.name);
    try {
      if (kind === 'gauge') {
        registry.registerGauge(metricName, `Bridged from tools counter '${parsed.name}'.`);
        registry.set(metricName, value, parsed.labels);
      } else {
        registry.registerCounter(metricName, `Bridged from tools counter '${parsed.name}'.`);
        const current = readBridgedValue(registry, metricName, parsed.labels);
        const delta = value - current;
        if (delta > 0) registry.inc(metricName, parsed.labels, delta);
      }
    } catch {
      // Best-effort: one malformed key (or a name registered by other
      // code with a conflicting kind) must never fail the scrape.
    }
  }
}

/** Parsed `name{k=v,...}` key in the tools `buildKey` format. */
interface ParsedCounterKey {
  readonly name: string;
  readonly labels: Record<string, string>;
}

function parseCounterKey(key: string): ParsedCounterKey | undefined {
  const brace = key.indexOf('{');
  if (brace === -1) return { name: key, labels: {} };
  if (!key.endsWith('}')) return undefined;
  const name = key.slice(0, brace);
  const body = key.slice(brace + 1, -1);
  const labels: Record<string, string> = {};
  for (const pair of body.split(',')) {
    const eq = pair.indexOf('=');
    if (eq <= 0) return undefined;
    const labelName = pair.slice(0, eq);
    if (!PROM_LABEL_NAME_RE.test(labelName)) return undefined;
    labels[labelName] = sanitizeLabelValue(pair.slice(eq + 1));
  }
  return { name, labels };
}

function toPrometheusName(name: string): string {
  return `graphorin_${name.replace(/[.-]/g, '_')}`;
}

/**
 * Same policy as the trigger-id sanitizer in `app-metrics.ts`: bound
 * the character set and the length so server identities / tool names
 * cannot explode label cardinality with UTF-8 sequences.
 */
function sanitizeLabelValue(value: string): string {
  return value.replace(/[^A-Za-z0-9_:.\-/]/g, '_').slice(0, 200);
}

function readBridgedValue(
  registry: MetricRegistry,
  name: string,
  labels: Record<string, string>,
): number {
  const entries = registry.snapshot().counters[name] ?? [];
  for (const entry of entries) {
    if (labelsEqual(entry.labels, labels)) return entry.value;
  }
  return 0;
}

function labelsEqual(
  a: Record<string, string | number | boolean>,
  b: Record<string, string>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of bKeys) {
    if (String(a[k]) !== b[k]) return false;
  }
  return true;
}
