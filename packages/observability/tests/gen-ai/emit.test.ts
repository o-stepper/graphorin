import type { SpanType } from '@graphorin/core';
import { beforeEach, describe, expect, it } from 'vitest';

import type { SpanRecord, TraceExporter } from '../../src/exporters/index.js';
import {
  _resetGenAISystemWarningsForTesting,
  deriveGenAISystem,
  emitGenAIAttributes,
  emitGenAIMessageEvents,
  OPERATION_NAME_TABLE,
  operationNameFor,
  setGenAISystemWarnSink,
} from '../../src/gen-ai/index.js';
import { createTracer } from '../../src/tracer/index.js';

describe('@graphorin/observability/gen-ai - operation name mapping', () => {
  it('maps every Graphorin span type the doc enumerates', () => {
    const knownTypes: ReadonlyArray<SpanType> = [
      'agent.run',
      'provider.generate',
      'provider.stream',
      'tool.execute',
      'memory.read.semantic',
      'memory.write.episodic',
      'memory.search.semantic',
      'memory.embed',
      'memory.consolidate.standard',
      'memory.conflict',
      'workflow.run',
      'mcp.call',
      'skill.activate',
    ];
    for (const t of knownTypes) {
      expect(operationNameFor(t)).toBeDefined();
    }
  });

  it('table is exported as a frozen array', () => {
    expect(OPERATION_NAME_TABLE.length).toBeGreaterThan(20);
  });
});

describe('@graphorin/observability/gen-ai - auto-derivation', () => {
  beforeEach(() => {
    _resetGenAISystemWarningsForTesting();
    setGenAISystemWarnSink(() => {});
  });

  it.each([
    ['AnthropicProvider', 'anthropic'],
    ['OpenAIProvider', 'openai'],
    ['GoogleProvider', 'google'],
    ['OllamaProvider', 'ollama'],
    ['MistralProvider', 'mistral'],
    ['CohereProvider', 'cohere'],
    ['VertexProvider', 'vertex_ai'],
  ] as const)('%s -> %s', (className, expected) => {
    expect(deriveGenAISystem(className)).toBe(expected);
  });

  it('returns null for unknown providers', () => {
    expect(deriveGenAISystem('SomeRandomProviderName')).toBeNull();
  });

  it('emits one structured WARN per unknown provider class', () => {
    const lines: string[] = [];
    setGenAISystemWarnSink((line) => lines.push(line));
    expect(deriveGenAISystem('UnknownVendorProvider')).toBeNull();
    expect(deriveGenAISystem('UnknownVendorProvider')).toBeNull();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('UnknownVendorProvider');
    expect(lines[0]).toContain('gen_ai.system');
  });
});

describe('@graphorin/observability/gen-ai - emitGenAIAttributes', () => {
  it('emits the canonical gen_ai.* attributes on a provider.generate span', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    const tracer = createTracer({ exporters: [exporter], warnSink: () => {} });
    await tracer.span({ type: 'provider.generate' }, async (span) => {
      emitGenAIAttributes(span, {
        system: 'anthropic',
        requestModel: 'claude-3-5-sonnet',
        responseModel: 'claude-3-5-sonnet',
        responseId: 'msg_001',
        inputTokens: 100,
        outputTokens: 50,
        finishReasons: ['stop'],
      });
    });
    await tracer.shutdown();
    const attrs = records[0]?.attributes ?? {};
    expect(attrs['gen_ai.system']).toBe('anthropic');
    expect(attrs['gen_ai.request.model']).toBe('claude-3-5-sonnet');
    expect(attrs['gen_ai.usage.input_tokens']).toBe(100);
    expect(attrs['gen_ai.usage.output_tokens']).toBe(50);
    expect(attrs['gen_ai.operation.name']).toBe('chat');
  });

  it('emits per-message events on the open span', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    // Per-message events default to 'internal' tier - raise the floor
    // so the validator preserves them in the export.
    const tracer = createTracer({
      exporters: [exporter],
      validation: { minTier: 'internal' },
      warnSink: () => {},
    });
    await tracer.span({ type: 'provider.generate' }, async (span) => {
      emitGenAIMessageEvents(
        span,
        [
          { role: 'system', content: 'You are helpful.' },
          { role: 'user', content: 'Hi.' },
          { role: 'assistant', content: 'Hello!' },
        ],
        { system: 'openai' },
      );
    });
    await tracer.shutdown();
    const eventNames = records[0]?.events.map((e) => e.name) ?? [];
    expect(eventNames).toEqual([
      'gen_ai.system.message',
      'gen_ai.user.message',
      'gen_ai.assistant.message',
    ]);
  });

  it('tags the gen_ai.* metadata attributes as public so default-deny exporters preserve them', async () => {
    const records: SpanRecord[] = [];
    const exporter = mockExporter((r) => records.push(r));
    const tracer = createTracer({
      exporters: [exporter],
      validation: { minTier: 'public' },
      warnSink: () => {},
    });
    await tracer.span({ type: 'provider.generate' }, async (span) => {
      emitGenAIAttributes(span, { system: 'openai', requestModel: 'gpt-4o' });
    });
    await tracer.shutdown();
    expect(records[0]?.attributes['gen_ai.system']).toBe('openai');
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
