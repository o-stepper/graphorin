import type { SpanType } from '@graphorin/core';
import { describe, expect, it } from 'vitest';

import type { SpanRecord, TraceExporter } from '../../src/exporters/index.js';
import {
  emitOpenInferenceKind,
  OPEN_INFERENCE_EXCLUDED_TYPES,
  OPEN_INFERENCE_KIND_TABLE,
  openInferenceKindFor,
} from '../../src/openinference/index.js';
import { createTracer } from '../../src/tracer/index.js';

describe('@graphorin/observability/openinference', () => {
  it.each([
    ['agent.run', 'AGENT'],
    ['agent.handoff', 'AGENT'],
    ['provider.generate', 'LLM'],
    ['tool.execute', 'TOOL'],
    ['memory.read.semantic', 'RETRIEVER'],
    ['memory.embed', 'EMBEDDING'],
    ['memory.consolidate.standard', 'CHAIN'],
    ['workflow.run', 'CHAIN'],
    ['mcp.call', 'TOOL'],
  ] as ReadonlyArray<readonly [SpanType, string]>)('%s -> %s', (type, expected) => {
    expect(openInferenceKindFor(type)).toBe(expected);
  });

  it.each(
    OPEN_INFERENCE_EXCLUDED_TYPES.map((t) => [t] as const),
  )('excluded span type %s does not map to a kind', (type) => {
    expect(openInferenceKindFor(type)).toBeNull();
  });

  it('emitOpenInferenceKind attaches the attribute on supported types', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    const tracer = createTracer({ exporters: [exporter], warnSink: () => {} });
    await tracer.span({ type: 'agent.run' }, async (span) => {
      emitOpenInferenceKind(span);
    });
    await tracer.shutdown();
    expect(records[0]?.attributes['openinference.span.kind']).toBe('AGENT');
  });

  it('emitOpenInferenceKind is a no-op on excluded span types', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    const tracer = createTracer({ exporters: [exporter], warnSink: () => {} });
    await tracer.span({ type: 'skill.activate' }, async (span) => {
      emitOpenInferenceKind(span);
    });
    await tracer.shutdown();
    expect(records[0]?.attributes['openinference.span.kind']).toBeUndefined();
  });

  it('OPEN_INFERENCE_KIND_TABLE contains the canonical mapping', () => {
    expect(OPEN_INFERENCE_KIND_TABLE.length).toBeGreaterThan(20);
  });
});

function mockExporter(onExport: (record: SpanRecord) => void): TraceExporter {
  return {
    id: 'mock',
    async export(record): Promise<void> {
      onExport(record);
    },
    async flush(): Promise<void> {},
    async shutdown(): Promise<void> {},
  };
}
