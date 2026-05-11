/**
 * Tiny Prometheus exposition layer. The framework intentionally does
 * not pull in `prom-client` so the bundle stays lean and so the
 * exposition is byte-stable across processes (`prom-client` adds
 * default counters that drift between Node releases).
 *
 * The supported metric kinds are the three the runtime spec calls
 * out: `counter`, `gauge`, and `summary` (with hard-coded p50/p95
 * quantiles). Sample rendering follows Prometheus text exposition
 * format v0.0.4 — every metric block is preceded by `# HELP` + `# TYPE`
 * and labels are quoted-escaped per the spec.
 *
 * @packageDocumentation
 */

/** @stable */
export type MetricKind = 'counter' | 'gauge' | 'summary';

/** @stable */
export type LabelSet = Readonly<Record<string, string | number | boolean>>;

interface MetricDefinition {
  readonly name: string;
  readonly help: string;
  readonly kind: MetricKind;
  readonly labelNames: ReadonlyArray<string>;
}

interface CounterEntry {
  readonly labels: LabelSet;
  value: number;
}

interface GaugeEntry {
  readonly labels: LabelSet;
  value: number;
}

interface SummaryEntry {
  readonly labels: LabelSet;
  count: number;
  sum: number;
  /** Recent samples (capped) used to compute quantiles. */
  samples: number[];
}

const SUMMARY_SAMPLE_CAP = 1024;
const SUMMARY_QUANTILES = Object.freeze([0.5, 0.95]);

/**
 * Lightweight Prometheus registry. Each instance owns its metric
 * catalogue + per-label samples; `render()` emits the canonical text
 * exposition block.
 *
 * @stable
 */
export class MetricRegistry {
  readonly #definitions = new Map<string, MetricDefinition>();
  readonly #counters = new Map<string, Map<string, CounterEntry>>();
  readonly #gauges = new Map<string, Map<string, GaugeEntry>>();
  readonly #summaries = new Map<string, Map<string, SummaryEntry>>();

  registerCounter(name: string, help: string, labelNames: ReadonlyArray<string> = []): void {
    this.#register(name, help, 'counter', labelNames);
    if (!this.#counters.has(name)) this.#counters.set(name, new Map());
  }

  registerGauge(name: string, help: string, labelNames: ReadonlyArray<string> = []): void {
    this.#register(name, help, 'gauge', labelNames);
    if (!this.#gauges.has(name)) this.#gauges.set(name, new Map());
  }

  registerSummary(name: string, help: string, labelNames: ReadonlyArray<string> = []): void {
    this.#register(name, help, 'summary', labelNames);
    if (!this.#summaries.has(name)) this.#summaries.set(name, new Map());
  }

  inc(name: string, labels: LabelSet = {}, by = 1): void {
    this.#assertKind(name, 'counter');
    assertLabelNames(labels);
    const bucket = this.#counters.get(name);
    if (bucket === undefined) {
      throw new Error(`MetricRegistry.inc: counter '${name}' is not registered`);
    }
    const key = serializeLabelKey(labels);
    const entry = bucket.get(key) ?? { labels: { ...labels }, value: 0 };
    if (!Number.isFinite(by)) {
      throw new Error(`MetricRegistry.inc(${name}): by must be finite`);
    }
    if (by < 0) {
      throw new Error(`MetricRegistry.inc(${name}): counters never decrement`);
    }
    entry.value += by;
    bucket.set(key, entry);
  }

  set(name: string, value: number, labels: LabelSet = {}): void {
    this.#assertKind(name, 'gauge');
    assertLabelNames(labels);
    const bucket = this.#gauges.get(name);
    if (bucket === undefined) {
      throw new Error(`MetricRegistry.set: gauge '${name}' is not registered`);
    }
    const key = serializeLabelKey(labels);
    bucket.set(key, { labels: { ...labels }, value });
  }

  observe(name: string, value: number, labels: LabelSet = {}): void {
    this.#assertKind(name, 'summary');
    assertLabelNames(labels);
    const bucket = this.#summaries.get(name);
    if (bucket === undefined) {
      throw new Error(`MetricRegistry.observe: summary '${name}' is not registered`);
    }
    const key = serializeLabelKey(labels);
    const entry = bucket.get(key) ?? { labels: { ...labels }, count: 0, sum: 0, samples: [] };
    entry.count += 1;
    entry.sum += value;
    entry.samples.push(value);
    if (entry.samples.length > SUMMARY_SAMPLE_CAP) {
      entry.samples.shift();
    }
    bucket.set(key, entry);
  }

  reset(): void {
    this.#counters.clear();
    this.#gauges.clear();
    this.#summaries.clear();
    for (const [name, def] of this.#definitions) {
      switch (def.kind) {
        case 'counter':
          this.#counters.set(name, new Map());
          break;
        case 'gauge':
          this.#gauges.set(name, new Map());
          break;
        case 'summary':
          this.#summaries.set(name, new Map());
          break;
      }
    }
  }

  /**
   * Render the current snapshot in Prometheus text exposition
   * format (v0.0.4). Never throws — incomplete sample buckets are
   * skipped instead of failing the scrape.
   */
  render(): string {
    const lines: string[] = [];
    for (const def of this.#definitions.values()) {
      lines.push(`# HELP ${def.name} ${escapeHelp(def.help)}`);
      lines.push(`# TYPE ${def.name} ${def.kind}`);
      switch (def.kind) {
        case 'counter': {
          const bucket = this.#counters.get(def.name);
          if (bucket !== undefined) {
            for (const entry of bucket.values()) {
              lines.push(formatSample(def.name, entry.labels, entry.value));
            }
          }
          break;
        }
        case 'gauge': {
          const bucket = this.#gauges.get(def.name);
          if (bucket !== undefined) {
            for (const entry of bucket.values()) {
              lines.push(formatSample(def.name, entry.labels, entry.value));
            }
          }
          break;
        }
        case 'summary': {
          const bucket = this.#summaries.get(def.name);
          if (bucket !== undefined) {
            for (const entry of bucket.values()) {
              for (const q of SUMMARY_QUANTILES) {
                const value = computeQuantile(entry.samples, q);
                if (value === undefined) continue;
                lines.push(
                  formatSample(def.name, { ...entry.labels, quantile: q.toString() }, value),
                );
              }
              lines.push(formatSample(`${def.name}_sum`, entry.labels, entry.sum));
              lines.push(formatSample(`${def.name}_count`, entry.labels, entry.count));
            }
          }
          break;
        }
      }
    }
    return `${lines.join('\n')}\n`;
  }

  contentType(): string {
    return 'text/plain; version=0.0.4; charset=utf-8';
  }

  /** Snapshot for tests / assertions. */
  snapshot(): {
    counters: Record<string, ReadonlyArray<{ labels: LabelSet; value: number }>>;
    gauges: Record<string, ReadonlyArray<{ labels: LabelSet; value: number }>>;
    summaries: Record<
      string,
      ReadonlyArray<{
        labels: LabelSet;
        count: number;
        sum: number;
        samples: ReadonlyArray<number>;
      }>
    >;
  } {
    const counters: Record<string, ReadonlyArray<{ labels: LabelSet; value: number }>> = {};
    for (const [name, bucket] of this.#counters) {
      counters[name] = [...bucket.values()].map((entry) => ({
        labels: entry.labels,
        value: entry.value,
      }));
    }
    const gauges: Record<string, ReadonlyArray<{ labels: LabelSet; value: number }>> = {};
    for (const [name, bucket] of this.#gauges) {
      gauges[name] = [...bucket.values()].map((entry) => ({
        labels: entry.labels,
        value: entry.value,
      }));
    }
    const summaries: Record<
      string,
      ReadonlyArray<{
        labels: LabelSet;
        count: number;
        sum: number;
        samples: ReadonlyArray<number>;
      }>
    > = {};
    for (const [name, bucket] of this.#summaries) {
      summaries[name] = [...bucket.values()].map((entry) => ({
        labels: entry.labels,
        count: entry.count,
        sum: entry.sum,
        samples: [...entry.samples],
      }));
    }
    return { counters, gauges, summaries };
  }

  #register(name: string, help: string, kind: MetricKind, labelNames: ReadonlyArray<string>): void {
    if (!METRIC_NAME_RE.test(name)) {
      throw new Error(`MetricRegistry: invalid metric name '${name}'`);
    }
    const existing = this.#definitions.get(name);
    if (existing !== undefined) {
      if (existing.kind !== kind) {
        throw new Error(
          `MetricRegistry: metric '${name}' already registered as '${existing.kind}', cannot redefine as '${kind}'`,
        );
      }
      return;
    }
    this.#definitions.set(name, {
      name,
      help,
      kind,
      labelNames: Object.freeze([...labelNames]),
    });
  }

  #assertKind(name: string, kind: MetricKind): void {
    const def = this.#definitions.get(name);
    if (def === undefined) {
      throw new Error(`MetricRegistry: unknown metric '${name}'`);
    }
    if (def.kind !== kind) {
      throw new Error(`MetricRegistry: metric '${name}' is a ${def.kind}, not a ${kind}`);
    }
  }
}

const METRIC_NAME_RE = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
const LABEL_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function assertLabelNames(labels: LabelSet): void {
  for (const key of Object.keys(labels)) {
    if (!LABEL_NAME_RE.test(key)) {
      throw new Error(`MetricRegistry: invalid label name '${key}'`);
    }
  }
}

function serializeLabelKey(labels: LabelSet): string {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return '';
  const parts: string[] = [];
  for (const k of keys) parts.push(`${k}=${String(labels[k])}`);
  return parts.join('|');
}

function formatSample(name: string, labels: LabelSet, value: number): string {
  const labelStr = formatLabels(labels);
  return `${name}${labelStr} ${formatNumber(value)}`;
}

function formatLabels(labels: LabelSet): string {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return '';
  const parts: string[] = [];
  for (const k of keys) {
    if (!LABEL_NAME_RE.test(k)) {
      throw new Error(`MetricRegistry: invalid label name '${k}'`);
    }
    parts.push(`${k}="${escapeLabelValue(String(labels[k]))}"`);
  }
  return `{${parts.join(',')}}`;
}

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function escapeHelp(help: string): string {
  return help.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
}

function formatNumber(value: number): string {
  if (Number.isNaN(value)) return 'NaN';
  if (!Number.isFinite(value)) return value > 0 ? '+Inf' : '-Inf';
  if (Number.isInteger(value)) return String(value);
  return value.toString();
}

function computeQuantile(samples: ReadonlyArray<number>, q: number): number | undefined {
  if (samples.length === 0) return undefined;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[idx];
}
