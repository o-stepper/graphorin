import { describe, expect, it } from 'vitest';

import type { SpanRecord } from '../../src/exporters/index.js';
import { createOTLPHttpExporter, toOtlpEnvelope } from '../../src/exporters/otlp-http.js';

const baseRecord: SpanRecord = {
  type: 'agent.run',
  id: 'span-id',
  traceId: 'trace-id',
  name: 'agent.run',
  startUnixNano: 1,
  endUnixNano: 2,
  status: 'ok',
  attributes: {},
  events: [],
};

describe('@graphorin/observability/exporters — OTLPHttpExporter coverage', () => {
  it('serialises every attribute value type', () => {
    const envelope = toOtlpEnvelope(
      {
        ...baseRecord,
        attributes: {
          str: 'value',
          int: 42,
          float: 1.5,
          bool: true,
          arr: ['a', 'b'],
          nullish: null,
        },
      },
      'svc',
    ) as {
      resourceSpans: Array<{ scopeSpans: Array<{ spans: Array<{ attributes: unknown[] }> }> }>;
    };
    const attrs = envelope.resourceSpans[0]?.scopeSpans[0]?.spans[0]?.attributes ?? [];
    expect(attrs).toHaveLength(6);
  });

  it('respects parent span id when present', () => {
    const envelope = toOtlpEnvelope({ ...baseRecord, parentId: 'parent-span' }, 'svc') as {
      resourceSpans: Array<{
        scopeSpans: Array<{ spans: Array<{ parentSpanId: string }> }>;
      }>;
    };
    expect(envelope.resourceSpans[0]?.scopeSpans[0]?.spans[0]?.parentSpanId).toBe('parent-span');
  });

  it('encodes status messages on errors', () => {
    const envelope = toOtlpEnvelope(
      { ...baseRecord, status: 'error', statusMessage: 'boom' },
      'svc',
    ) as {
      resourceSpans: Array<{
        scopeSpans: Array<{ spans: Array<{ status: { code: number; message?: string } }> }>;
      }>;
    };
    expect(envelope.resourceSpans[0]?.scopeSpans[0]?.spans[0]?.status.code).toBe(2);
    expect(envelope.resourceSpans[0]?.scopeSpans[0]?.spans[0]?.status.message).toBe('boom');
  });

  it('respects the abort timeout', async () => {
    const exporter = createOTLPHttpExporter({
      url: 'http://localhost:4318/v1/traces',
      fetchImpl: (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        }),
      timeoutMs: 5,
    });
    await expect(exporter.export(baseRecord)).rejects.toThrow();
  });

  it('skips export after shutdown', async () => {
    let calls = 0;
    const exporter = createOTLPHttpExporter({
      url: 'http://localhost:4318/v1/traces',
      fetchImpl: async () => {
        calls += 1;
        return new Response(null, { status: 200 });
      },
    });
    await exporter.shutdown();
    await exporter.export(baseRecord);
    expect(calls).toBe(0);
  });
});
