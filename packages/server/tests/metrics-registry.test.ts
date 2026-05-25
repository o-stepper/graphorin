import { describe, expect, it } from 'vitest';

import { createServerMetricRegistry, SERVER_METRIC_NAMES } from '../src/metrics/catalog.js';
import { MetricRegistry } from '../src/metrics/registry.js';

describe('MetricRegistry', () => {
  it('registers + increments counters and renders Prometheus exposition', () => {
    const registry = new MetricRegistry();
    registry.registerCounter('demo_total', 'Demo counter', ['status']);
    registry.inc('demo_total', { status: 'ok' });
    registry.inc('demo_total', { status: 'ok' }, 4);
    registry.inc('demo_total', { status: 'fail' });
    const output = registry.render();
    expect(output).toContain('# HELP demo_total Demo counter');
    expect(output).toContain('# TYPE demo_total counter');
    expect(output).toContain('demo_total{status="ok"} 5');
    expect(output).toContain('demo_total{status="fail"} 1');
  });

  it('rejects negative counter increments and finite-only values', () => {
    const registry = new MetricRegistry();
    registry.registerCounter('c_total', 'Counter');
    expect(() => registry.inc('c_total', {}, -1)).toThrowError(/never decrement/);
    expect(() => registry.inc('c_total', {}, Number.NaN)).toThrowError(/finite/);
  });

  it('rejects redefining a metric with a different kind', () => {
    const registry = new MetricRegistry();
    registry.registerCounter('shape', 'help');
    expect(() => registry.registerGauge('shape', 'help')).toThrowError(/already registered/);
  });

  it('renders summaries with quantile labels and sum/count siblings', () => {
    const registry = new MetricRegistry();
    registry.registerSummary('latency_seconds', 'Latency');
    for (let i = 1; i <= 10; i++) registry.observe('latency_seconds', i);
    const output = registry.render();
    expect(output).toContain('latency_seconds{quantile="0.5"}');
    expect(output).toContain('latency_seconds{quantile="0.95"}');
    expect(output).toContain('latency_seconds_sum 55');
    expect(output).toContain('latency_seconds_count 10');
  });

  it('updates gauges in place', () => {
    const registry = new MetricRegistry();
    registry.registerGauge('inflight', 'Inflight runs');
    registry.set('inflight', 1);
    registry.set('inflight', 7);
    expect(registry.render()).toContain('inflight 7');
  });

  it('escapes label values with quotes / newlines / backslashes', () => {
    const registry = new MetricRegistry();
    registry.registerCounter('escaped_total', 'Edge cases', ['msg']);
    registry.inc('escaped_total', { msg: 'a"b\\c\nd' });
    const output = registry.render();
    expect(output).toContain('escaped_total{msg="a\\"b\\\\c\\nd"} 1');
  });

  it('rejects invalid metric and label names', () => {
    const registry = new MetricRegistry();
    expect(() => registry.registerCounter('bad-name', 'help')).toThrowError(/invalid metric name/);
    registry.registerGauge('ok_name', 'help');
    expect(() => registry.set('ok_name', 1, { 'bad-label': 'x' })).toThrowError(
      /invalid label name/,
    );
  });

  it('reset clears samples but preserves declarations', () => {
    const registry = new MetricRegistry();
    registry.registerGauge('g', 'help');
    registry.set('g', 5);
    registry.reset();
    const output = registry.render();
    expect(output).toContain('# TYPE g gauge');
    expect(output).not.toContain('g 5');
  });

  it('contentType matches Prometheus text exposition v0.0.4', () => {
    const registry = new MetricRegistry();
    expect(registry.contentType()).toBe('text/plain; version=0.0.4; charset=utf-8');
  });

  it('createServerMetricRegistry registers the canonical metric inventory', () => {
    const registry = createServerMetricRegistry();
    const output = registry.render();
    for (const name of Object.values(SERVER_METRIC_NAMES)) {
      expect(output).toContain(`# TYPE ${name}`);
    }
  });

  it('renders non-finite values as +Inf / -Inf / NaN per Prometheus convention', () => {
    const registry = new MetricRegistry();
    registry.registerGauge('weird', 'help');
    registry.set('weird', Number.POSITIVE_INFINITY, { kind: 'pos' });
    registry.set('weird', Number.NEGATIVE_INFINITY, { kind: 'neg' });
    registry.set('weird', Number.NaN, { kind: 'nan' });
    const output = registry.render();
    expect(output).toContain('weird{kind="pos"} +Inf');
    expect(output).toContain('weird{kind="neg"} -Inf');
    expect(output).toContain('weird{kind="nan"} NaN');
  });

  it('renders 1000 metric samples in well under the 50ms budget', () => {
    const registry = new MetricRegistry();
    registry.registerCounter('bench_total', 'Bench counter', ['k']);
    for (let i = 0; i < 1000; i++) registry.inc('bench_total', { k: `bucket-${i % 50}` });
    const start = performance.now();
    const output = registry.render();
    const elapsed = performance.now() - start;
    expect(output).toContain('# TYPE bench_total counter');
    expect(elapsed).toBeLessThan(50);
  });

  it('produces output that conforms to Prometheus text format constraints', () => {
    const registry = createServerMetricRegistry();
    registry.set(SERVER_METRIC_NAMES.buildInfo, 1, { version: '0.4.0' });
    registry.inc(SERVER_METRIC_NAMES.toolCallsTotal, { tool: 'fetch', status: 'ok' });
    const output = registry.render();
    // Every block must have HELP + TYPE preceding the first sample line.
    const lines = output.split('\n').filter((l) => l.length > 0);
    const helpLines = lines.filter((l) => l.startsWith('# HELP '));
    const typeLines = lines.filter((l) => l.startsWith('# TYPE '));
    expect(helpLines.length).toBe(typeLines.length);
    // Every sample line must reference a registered metric name.
    const declaredNames = new Set(typeLines.map((l) => l.split(' ')[2]));
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const head = line.split(' ', 1)[0]!;
      const baseName = head.includes('{') ? head.slice(0, head.indexOf('{')) : head;
      const candidate = baseName.replace(/_(sum|count)$/, '');
      expect(declaredNames.has(baseName) || declaredNames.has(candidate)).toBe(true);
    }
  });
});
