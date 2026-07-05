import { describe, expect, it } from 'vitest';

import {
  createConsoleExporter,
  createJSONLExporter,
  createOTLPHttpExporter,
  isValidatedExporter,
  type SpanRecord,
  withValidation,
} from '../../src/exporters/index.js';
import { createRedactionValidator } from '../../src/redaction/index.js';

describe('@graphorin/observability/exporters - withValidation', () => {
  it('marks the exporter as validated', () => {
    const wrapped = withValidation(createConsoleExporter({ sink: () => {} }));
    expect(isValidatedExporter(wrapped)).toBe(true);
  });

  it('un-wrapped exporters fail the validated check', () => {
    const exporter = createConsoleExporter({ sink: () => {} });
    expect(isValidatedExporter(exporter)).toBe(false);
  });

  it('strips sensitive attribute values whose declared tier exceeds the floor, keeping the span (RP-18)', async () => {
    const lines: string[] = [];
    const wrapped = withValidation(createConsoleExporter({ sink: (line) => lines.push(line) }), {
      minTier: 'public',
    });
    const record = sampleRecord({
      attributes: { 'graphorin.session.id': 'session-1', 'tool.input': 'top secret' },
      sensitivityByAttribute: { 'graphorin.session.id': 'public', 'tool.input': 'secret' },
    });
    await wrapped.export(record);
    // RP-18: attribute-granular strip, not a whole-record drop - the span
    // still reaches the exporter with the offending attribute removed.
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.attributes['graphorin.session.id']).toBe('session-1'); // public → kept
    expect(parsed.attributes['tool.input']).toBeUndefined(); // secret > public floor → stripped
  });

  it('RP-18: an untagged framework attribute is stripped but the span still exports', async () => {
    const lines: string[] = [];
    const wrapped = withValidation(createConsoleExporter({ sink: (line) => lines.push(line) }), {
      minTier: 'public',
    });
    // A framework span: one public-tagged attr + one UNTAGGED attr (defaults
    // to 'internal', exceeding the 'public' floor). Before RP-18 the entire
    // record vanished from every exporter, so operators saw empty traces.
    const record = sampleRecord({
      attributes: { 'tool.name': 'lookup', 'memory.scope.user_id': 'u-1' },
      sensitivityByAttribute: { 'tool.name': 'public' },
    });
    await wrapped.export(record);
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.attributes['tool.name']).toBe('lookup'); // public → kept
    expect(parsed.attributes['memory.scope.user_id']).toBeUndefined(); // untagged → stripped
    expect(parsed.droppedReason).toBeUndefined();
  });

  it('forwards records when nothing exceeds the floor', async () => {
    const lines: string[] = [];
    const wrapped = withValidation(createConsoleExporter({ sink: (line) => lines.push(line) }), {
      minTier: 'public',
    });
    const record = sampleRecord({
      attributes: { 'graphorin.session.id': 'session-1', 'tool.name': 'lookup' },
      sensitivityByAttribute: { 'graphorin.session.id': 'public', 'tool.name': 'public' },
    });
    await wrapped.export(record);
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.droppedReason).toBeUndefined();
    expect(parsed.attributes['tool.name']).toBe('lookup');
  });

  it('reuses an externally-supplied validator', async () => {
    const validator = createRedactionValidator({ minTier: 'public' });
    const wrapped = withValidation(createConsoleExporter({ sink: () => {} }), { validator });
    await wrapped.export(
      sampleRecord({
        attributes: { 'tool.input': 'sk-1234567890abcdef1234567890' },
        sensitivityByAttribute: { 'tool.input': 'public' },
      }),
    );
    expect(validator.counters().matchesByPattern['openai-key']).toBeGreaterThan(0);
  });

  it('exposes the OTLP envelope shape', () => {
    const exporter = createOTLPHttpExporter({
      url: 'http://localhost:4318/v1/traces',
      fetchImpl: async () => new Response(null, { status: 200 }),
    });
    expect(exporter.id).toBe('otlp-http');
  });

  it('OTLP exporter posts the OTLP envelope', async () => {
    let posted: { readonly url: string; readonly body: unknown } | null = null;
    const exporter = createOTLPHttpExporter({
      url: 'http://localhost:4318/v1/traces',
      fetchImpl: async (url, init) => {
        posted = { url: String(url), body: JSON.parse(String(init?.body ?? '{}')) };
        return new Response(null, { status: 200 });
      },
    });
    await exporter.export(sampleRecord({}));
    expect(posted).not.toBeNull();
    expect((posted as unknown as { url: string }).url).toBe('http://localhost:4318/v1/traces');
    expect(
      (posted as unknown as { body: { resourceSpans: unknown[] } }).body.resourceSpans,
    ).toHaveLength(1);
  });

  it('OTLP exporter raises on non-2xx response', async () => {
    const exporter = createOTLPHttpExporter({
      url: 'http://localhost:4318/v1/traces',
      fetchImpl: async () =>
        new Response('boom', { status: 500, statusText: 'Internal Server Error' }),
    });
    await expect(exporter.export(sampleRecord({}))).rejects.toThrow(/500/);
  });

  it('JSONL exporter writes one line per record', async () => {
    const tmp = await import('node:fs/promises');
    const path = await import('node:path');
    const root = await tmp.mkdtemp(
      path.join((await import('node:os')).tmpdir(), 'graphorin-jsonl-'),
    );
    const exporter = createJSONLExporter({ path: root });
    await exporter.export(sampleRecord({ id: 'span-a' }));
    await exporter.export(sampleRecord({ id: 'span-b' }));
    await exporter.flush();
    await exporter.shutdown();
    const dirs = await tmp.readdir(root);
    expect(dirs.length).toBeGreaterThan(0);
  });
});

function sampleRecord(overrides: Partial<SpanRecord>): SpanRecord {
  return {
    type: 'agent.run',
    id: overrides.id ?? 'span-id',
    traceId: overrides.traceId ?? 'trace-id',
    name: 'agent.run',
    startUnixNano: 1,
    endUnixNano: 2,
    status: 'ok',
    attributes: overrides.attributes ?? {},
    events: overrides.events ?? [],
    ...(overrides.sensitivityByAttribute === undefined
      ? {}
      : { sensitivityByAttribute: overrides.sensitivityByAttribute }),
    ...(overrides.parentId === undefined ? {} : { parentId: overrides.parentId }),
  };
}
