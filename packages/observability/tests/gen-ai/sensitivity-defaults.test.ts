/**
 * Verifies the per-attribute sensitivity tagging defaults catalogue
 * documented in 09-observability.md § "OpenTelemetry GenAI semconv
 * conformance" — every `gen_ai.*` metadata attribute is tagged
 * `'public'` so the default `minTier: 'public'` exporter preserves it.
 */

import { describe, expect, it } from 'vitest';

import type { SpanRecord, TraceExporter } from '../../src/exporters/index.js';
import { emitGenAIAttributes } from '../../src/gen-ai/index.js';
import { createTracer } from '../../src/tracer/index.js';

describe('@graphorin/observability/gen-ai — per-attribute sensitivity defaults catalogue', () => {
  it('every metadata attribute survives the default minTier=public exporter', async () => {
    const records: SpanRecord[] = [];
    const tracer = createTracer({
      exporters: [collector(records)],
      // Default minTier — most aggressive default-deny posture.
      warnSink: () => {},
    });
    await tracer.span({ type: 'provider.generate' }, async (span) => {
      emitGenAIAttributes(span, {
        system: 'openai',
        requestModel: 'gpt-4o',
        responseModel: 'gpt-4o',
        responseId: 'resp_001',
        inputTokens: 100,
        outputTokens: 50,
        finishReasons: ['stop'],
        agentId: 'agent-1',
        agentName: 'support-bot',
        sessionId: 'sess-1',
      });
    });
    await tracer.shutdown();

    expect(records).toHaveLength(1);
    const attrs = records[0]?.attributes ?? {};
    // Every documented public attribute must survive default-deny.
    expect(attrs['gen_ai.system']).toBe('openai');
    expect(attrs['gen_ai.request.model']).toBe('gpt-4o');
    expect(attrs['gen_ai.response.model']).toBe('gpt-4o');
    expect(attrs['gen_ai.response.id']).toBe('resp_001');
    expect(attrs['gen_ai.usage.input_tokens']).toBe(100);
    expect(attrs['gen_ai.usage.output_tokens']).toBe(50);
    expect(attrs['gen_ai.response.finish_reasons']).toEqual(['stop']);
    expect(attrs['gen_ai.agent.id']).toBe('agent-1');
    expect(attrs['gen_ai.agent.name']).toBe('support-bot');
    expect(attrs['gen_ai.session.id']).toBe('sess-1');
    expect(attrs['gen_ai.operation.name']).toBe('chat');
  });

  it('tool metadata attributes survive the default minTier=public exporter', async () => {
    const records: SpanRecord[] = [];
    const tracer = createTracer({ exporters: [collector(records)], warnSink: () => {} });
    await tracer.span({ type: 'tool.execute' }, async (span) => {
      emitGenAIAttributes(span, {
        toolName: 'web_search',
        toolType: 'web_search',
        toolCallId: 'call_001',
        toolDescription: 'Search the web for the supplied query.',
      });
    });
    await tracer.shutdown();
    const attrs = records[0]?.attributes ?? {};
    expect(attrs['gen_ai.tool.name']).toBe('web_search');
    expect(attrs['gen_ai.tool.type']).toBe('web_search');
    expect(attrs['gen_ai.tool.call.id']).toBe('call_001');
    expect(attrs['gen_ai.tool.description']).toBe('Search the web for the supplied query.');
  });
});

function collector(records: SpanRecord[]): TraceExporter {
  return {
    id: 'mock',
    async export(record): Promise<void> {
      records.push(record);
    },
    async flush(): Promise<void> {},
    async shutdown(): Promise<void> {},
  };
}
