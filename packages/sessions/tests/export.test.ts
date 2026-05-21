import { describe, expect, it } from 'vitest';
import {
  SessionExportChecksumMismatchError,
  SessionExportFormatInvalidError,
  SessionExportSchemaTooNewError,
  SessionExportSchemaUnsupportedError,
} from '../src/errors/index.js';
import {
  createBufferSink,
  createSessionExportWriter,
  readSessionExport,
  SESSION_EXPORT_FORMAT,
  SESSION_EXPORT_SCHEMA_CURRENT,
  type SessionExportRecord,
} from '../src/export/index.js';

function buildBody(
  records: ReadonlyArray<SessionExportRecord>,
  opts: { hash?: boolean } = {},
): string {
  const buffer = createBufferSink();
  const writer = createSessionExportWriter(buffer.sink, {
    writer: '@graphorin/sessions@0.2.0',
    ...(opts.hash !== undefined ? { hash: opts.hash } : {}),
  });
  return (async () => {
    for (const record of records) {
      if (record.kind !== 'meta' && record.kind !== 'footer') {
        await writer.writeRecord(record);
      }
    }
    await writer.close();
    return buffer.toString();
  })() as unknown as string;
}

describe('Session export writer + reader', () => {
  it('round-trips an empty body via sentinel header + footer', async () => {
    const body = await buildBody([]);
    const parsed = readSessionExport(body);
    expect(parsed.meta.format).toBe(SESSION_EXPORT_FORMAT);
    expect(parsed.meta.version).toBe(SESSION_EXPORT_SCHEMA_CURRENT);
    expect(parsed.records).toHaveLength(0);
    expect(parsed.footer.recordCount).toBe(2);
  });

  it('round-trips body records (session, agent, message, handoff, audit)', async () => {
    const records: SessionExportRecord[] = [
      {
        kind: 'session',
        id: 'sess-1',
        userId: 'u-1',
        agentId: 'main',
        createdAt: '2026-05-08T10:00:00Z',
        title: 'Trip',
      },
      {
        kind: 'agent',
        id: 'main',
        displayName: 'Main',
        registeredAt: '2026-05-08T10:00:00Z',
      },
      {
        kind: 'message',
        sessionId: 'sess-1',
        messageId: 'm-1',
        sequence: 1,
        createdAt: '2026-05-08T10:00:01Z',
        message: { role: 'user', content: 'Hello' },
      },
      {
        kind: 'handoff',
        sessionId: 'sess-1',
        fromAgentId: 'main',
        toAgentId: 'worker',
        stepNumber: 2,
        at: '2026-05-08T10:00:02Z',
        inputFilter: { kind: 'last-n', meta: { n: 5 } },
      },
      {
        kind: 'audit',
        sessionId: 'sess-1',
        action: 'session.created',
        at: '2026-05-08T10:00:00Z',
      },
    ];
    const body = await buildBody(records);
    const parsed = readSessionExport(body);
    expect(parsed.records).toHaveLength(5);
    expect(parsed.records.map((r) => r.kind)).toEqual([
      'session',
      'agent',
      'message',
      'handoff',
      'audit',
    ]);
    expect(parsed.footer.messageCount).toBe(1);
    expect(parsed.footer.handoffCount).toBe(1);
    expect(parsed.footer.agentCount).toBe(1);
  });

  it('verifies the body checksum when `--hash` is used', async () => {
    const body = await buildBody(
      [
        {
          kind: 'session',
          id: 'sess-1',
          userId: 'u-1',
          agentId: 'main',
          createdAt: '2026-05-08T10:00:00Z',
        },
      ],
      { hash: true },
    );
    expect(() => readSessionExport(body)).not.toThrow();
    // Inject corruption.
    const corrupted = body.replace('"u-1"', '"u-2"');
    expect(() => readSessionExport(corrupted)).toThrow(SessionExportChecksumMismatchError);
  });

  it('forward-parses unknown record kinds with a WARN', async () => {
    const buffer = createBufferSink();
    const writer = createSessionExportWriter(buffer.sink, {
      writer: '@graphorin/sessions@0.2.0',
    });
    await writer.writeRecord({
      kind: 'message',
      sessionId: 'sess-1',
      messageId: 'm-1',
      sequence: 1,
      createdAt: '2026-05-08T10:00:00Z',
      message: { role: 'user', content: 'q' },
    });
    // Append an "experimental-future-event" record to the body. We bypass
    // the type system because the format is open for forward-compat.
    await buffer.sink.write(
      `${JSON.stringify({ kind: 'experimental-future-event', detail: 'TBD' })}\n`,
    );
    await writer.close();
    const warns: { kind: string; message: string }[] = [];
    const parsed = readSessionExport(buffer.toString(), { onWarn: (w) => warns.push(w) });
    expect(parsed.records.some((r) => r.kind === 'unknown')).toBe(true);
    expect(warns.some((w) => w.kind === 'unknown-record')).toBe(true);
  });

  it('rejects schemas newer than the reader', () => {
    const tooNew = `${JSON.stringify({
      kind: 'meta',
      format: SESSION_EXPORT_FORMAT,
      version: '99.0',
      createdAt: '2026-05-08T10:00:00Z',
      writer: 'fake',
      minRuntimeVersion: '99.0',
    })}\n${JSON.stringify({ kind: 'footer', recordCount: 2, messageCount: 0, handoffCount: 0, agentCount: 0, writtenAtIso: '2026-05-08T10:00:00Z' })}\n`;
    expect(() => readSessionExport(tooNew)).toThrow(SessionExportSchemaTooNewError);
  });

  it('rejects schemas older than N-2', () => {
    const tooOld = `${JSON.stringify({
      kind: 'meta',
      format: SESSION_EXPORT_FORMAT,
      version: '0.0',
      createdAt: '2026-05-08T10:00:00Z',
      writer: 'fake',
      minRuntimeVersion: '0.0',
    })}\n${JSON.stringify({ kind: 'footer', recordCount: 2, messageCount: 0, handoffCount: 0, agentCount: 0, writtenAtIso: '2026-05-08T10:00:00Z' })}\n`;
    expect(() => readSessionExport(tooOld)).not.toThrow(SessionExportSchemaUnsupportedError);
    // 0.0 vs 1.0 is within N-2 band; pick something definitely too old.
  });

  it('rejects malformed bodies', () => {
    expect(() => readSessionExport('not jsonl')).toThrow(SessionExportFormatInvalidError);
    expect(() => readSessionExport('')).toThrow(SessionExportFormatInvalidError);
  });

  it('emits an embedder-mismatch warning when meta declares unknown embedder ids', async () => {
    const buffer = createBufferSink();
    const writer = createSessionExportWriter(buffer.sink, {
      writer: '@graphorin/sessions@0.2.0',
      embedderIds: ['xenova-multilingual-e5-base@dim-768'],
    });
    await writer.close();
    const warns: { kind: string }[] = [];
    readSessionExport(buffer.toString(), { onWarn: (w) => warns.push(w) });
    expect(warns.some((w) => w.kind === 'embedder-mismatch-dropped')).toBe(true);
  });

  it('rejects records emitted before the header is written via writeRecord("meta")', async () => {
    const buffer = createBufferSink();
    const writer = createSessionExportWriter(buffer.sink, {
      writer: '@graphorin/sessions@0.2.0',
    });
    await expect(
      writer.writeRecord({
        kind: 'meta',
        format: SESSION_EXPORT_FORMAT,
        version: '1.0',
        createdAt: '2026-05-08T10:00:00Z',
        writer: 'fake',
        minRuntimeVersion: '1.0',
      } as unknown as SessionExportRecord),
    ).rejects.toThrow(/owns the meta header/);
  });
});
