import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import {
  createJSONLExporter,
  type SpanRecord,
  type TraceExporter,
  withValidation,
} from '../../src/exporters/index.js';
import { createRedactionValidator } from '../../src/redaction/index.js';
import { createReplay } from '../../src/replay/index.js';
import { getTraceLog } from '../../src/replay/log.js';

const SESSION = 'sess-s20';

function sampleRecord(): SpanRecord {
  return {
    type: 'tool.execute',
    id: 'span-s20',
    traceId: 'trace-s20',
    name: 'tool.execute',
    startUnixNano: 1,
    endUnixNano: 2,
    status: 'ok',
    attributes: {
      'graphorin.session.id': SESSION,
      'tool.name': 'demo-tool',
      note: 'benign-detail',
      credential: 'super-secret-value',
    },
    sensitivityByAttribute: {
      'graphorin.session.id': 'public',
      'tool.name': 'public',
      note: 'internal',
      credential: 'secret',
    },
    events: [
      {
        name: 'checkpoint',
        timeUnixNano: 5,
        attributes: { phase: 'verify', detail: 'not for export' },
        sensitivityByAttribute: { phase: 'public', detail: 'secret' },
      },
    ],
  };
}

interface ReplayOutcome {
  readonly decisions: ReadonlyArray<string>;
  readonly emittedAttrs: Readonly<Record<string, unknown>> | null;
  readonly emittedEventAttrs: Readonly<Record<string, unknown>> | null;
}

async function runReplay(
  records: ReadonlyArray<SpanRecord>,
  minSensitivity: 'public' | 'internal' | 'secret',
  validatorFloor: 'public' | 'internal' | 'secret',
): Promise<ReplayOutcome> {
  const replay = createReplay({
    validator: createRedactionValidator({ minTier: validatorFloor }),
  });
  const decisions: string[] = [];
  let emittedAttrs: Readonly<Record<string, unknown>> | null = null;
  let emittedEventAttrs: Readonly<Record<string, unknown>> | null = null;
  for await (const event of replay.run({
    source: records,
    target: `session:${SESSION}`,
    minSensitivity,
  })) {
    if (event.type === 'replay.event') {
      decisions.push('event');
      emittedAttrs = event.span.attributes;
      emittedEventAttrs = event.span.events[0]?.attributes ?? null;
    } else if (event.type === 'replay.skipped') {
      decisions.push(`skipped:${event.reason}`);
    }
  }
  return { decisions, emittedAttrs, emittedEventAttrs };
}

describe('S-20/9 - sensitivity map survives both export paths identically', () => {
  const tmpRoots: string[] = [];

  afterAll(async () => {
    for (const root of tmpRoots) {
      await rm(root, { recursive: true, force: true });
    }
  });

  async function exportBothPaths(): Promise<{
    jsonl: ReadonlyArray<SpanRecord>;
    stored: ReadonlyArray<SpanRecord>;
  }> {
    const root = await mkdtemp(join(tmpdir(), 'graphorin-s20-'));
    tmpRoots.push(root);

    // The "store" path: captures the exact sanitized record object that
    // createSqliteSpanExporter persists verbatim (attributes, events and
    // sensitivityByAttribute serialized as-is).
    const stored: SpanRecord[] = [];
    const memExporter: TraceExporter = {
      id: 'mem',
      async export(record: SpanRecord): Promise<void> {
        stored.push(record);
      },
      async flush(): Promise<void> {},
      async shutdown(): Promise<void> {},
    };

    const jsonlExporter = createJSONLExporter({ path: root });
    // Export floor 'internal': the secret-tagged values are stripped at
    // export time by the mandatory validation wrapper.
    const validator = createRedactionValidator({ minTier: 'internal' });
    const record = sampleRecord();
    await withValidation(jsonlExporter, { validator }).export(record);
    await withValidation(memExporter, { validator }).export(record);
    await jsonlExporter.flush();
    await jsonlExporter.shutdown();

    const monthDirs = await readdir(root);
    const file = join(root, monthDirs[0] as string, `${SESSION}.jsonl`);
    const jsonl: SpanRecord[] = [];
    for await (const parsed of getTraceLog(file)) {
      jsonl.push(parsed);
    }
    return { jsonl, stored };
  }

  it('JSONL persists the same pruned sensitivity map as the store path (span + event)', async () => {
    const { jsonl, stored } = await exportBothPaths();
    expect(jsonl).toHaveLength(1);
    expect(stored).toHaveLength(1);

    // Span-level map: serialized on the JSONL line, pruned of the stripped
    // 'credential' entry on both paths.
    const expectedMap = {
      'graphorin.session.id': 'public',
      'tool.name': 'public',
      note: 'internal',
    };
    expect(jsonl[0]?.sensitivityByAttribute).toEqual(expectedMap);
    expect(stored[0]?.sensitivityByAttribute).toEqual(expectedMap);

    // Event-level map: kept (pruned of the stripped 'detail' entry).
    expect(jsonl[0]?.events[0]?.sensitivityByAttribute).toEqual({ phase: 'public' });
    expect(stored[0]?.events[0]?.sensitivityByAttribute).toEqual({ phase: 'public' });
  });

  it('replay skip decisions are identical for the same span from either source', async () => {
    const { jsonl, stored } = await exportBothPaths();

    // Floor 'internal': every surviving attribute is within the floor, so
    // neither source may skip (pre-fix: the store path skipped on the stale
    // 'secret' entry while JSONL, having lost the map, emitted).
    const jsonlInternal = await runReplay(jsonl, 'internal', 'internal');
    const storedInternal = await runReplay(stored, 'internal', 'internal');
    expect(jsonlInternal.decisions).toEqual(['event']);
    expect(storedInternal.decisions).toEqual(jsonlInternal.decisions);

    // Floor 'public': the surviving 'note' attribute is tagged 'internal',
    // so BOTH sources must skip (pre-fix: JSONL emitted because the map was
    // lost, making minSensitivity inert).
    const jsonlPublic = await runReplay(jsonl, 'public', 'internal');
    const storedPublic = await runReplay(stored, 'public', 'internal');
    expect(jsonlPublic.decisions).toEqual(['skipped:sensitivity']);
    expect(storedPublic.decisions).toEqual(jsonlPublic.decisions);
  });

  it('public-tagged attributes are no longer over-stripped on JSONL-sourced replay', async () => {
    const { jsonl, stored } = await exportBothPaths();

    // Replay through a 'public'-floor validator: only genuinely public-tagged
    // attributes survive re-sanitization. Pre-fix the JSONL path emitted {}
    // because every tag was lost (default-deny).
    const jsonlOut = await runReplay(jsonl, 'secret', 'public');
    const storedOut = await runReplay(stored, 'secret', 'public');
    expect(jsonlOut.emittedAttrs).toEqual({
      'graphorin.session.id': SESSION,
      'tool.name': 'demo-tool',
    });
    expect(jsonlOut.emittedAttrs).toEqual(storedOut.emittedAttrs);
    expect(jsonlOut.emittedEventAttrs).toEqual({ phase: 'verify' });
    expect(jsonlOut.emittedEventAttrs).toEqual(storedOut.emittedEventAttrs);
  });
});
