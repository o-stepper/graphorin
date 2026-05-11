import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CassetteIdempotencyMismatchError,
  type CassetteReplayDecision,
  createCassetteBufferSink,
  createToolCassetteRecorder,
  createToolCassetteWriter,
  decideToolReplay,
  readToolCassette,
  sha256OfValue,
  TOOL_CASSETTE_FORMAT,
  type ToolCallRecord,
} from '../src/cassette/index.js';
import { CassetteCursorViolationError, CassetteFormatInvalidError } from '../src/errors/index.js';

describe('Tool cassette format', () => {
  it('writes a valid sentinel header + footer with body checksum on `--hash`', async () => {
    const buffer = createCassetteBufferSink();
    const writer = createToolCassetteWriter(buffer.sink, {
      writer: '@graphorin/sessions@0.1.0',
      sessionId: 'sess-1',
      runId: 'run-1',
      hash: true,
    });
    await writer.writeRecord({
      kind: 'tool-call',
      stepNumber: 1,
      toolCallId: 'tc-1',
      toolName: 'pure-tool',
      sideEffectClass: 'pure',
      args: { q: 'hello' },
      output: { ok: true },
      status: 'completed',
      durationMs: 10,
      agentId: 'main',
      timestampIso: '2026-05-08T10:00:00Z',
      sha256OfArgs: sha256OfValue({ q: 'hello' }),
      sha256OfOutput: sha256OfValue({ ok: true }),
    });
    await writer.close();
    const parsed = readToolCassette(buffer.toString());
    expect(parsed.meta.format).toBe(TOOL_CASSETTE_FORMAT);
    expect(parsed.toolCalls).toHaveLength(1);
    expect(parsed.footer.toolCallCount).toBe(1);
    expect(parsed.footer.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('rejects an out-of-order tool-call cursor', async () => {
    const buffer = createCassetteBufferSink();
    const writer = createToolCassetteWriter(buffer.sink, {
      writer: 'fake',
      sessionId: 'sess-1',
      runId: 'run-1',
    });
    await writer.writeRecord({
      kind: 'tool-call',
      stepNumber: 2,
      toolCallId: 'tc-2',
      toolName: 'a',
      sideEffectClass: 'pure',
      args: {},
      output: {},
      status: 'completed',
      durationMs: 1,
      agentId: 'main',
      timestampIso: '2026-05-08T10:00:00Z',
    });
    await writer.writeRecord({
      kind: 'tool-call',
      stepNumber: 1,
      toolCallId: 'tc-1',
      toolName: 'b',
      sideEffectClass: 'pure',
      args: {},
      output: {},
      status: 'completed',
      durationMs: 1,
      agentId: 'main',
      timestampIso: '2026-05-08T10:00:00Z',
    });
    await writer.close();
    expect(() => readToolCassette(buffer.toString())).toThrow(CassetteCursorViolationError);
  });

  it('rejects bodies that do not start with a meta sentinel', () => {
    expect(() => readToolCassette('not a cassette')).toThrow(CassetteFormatInvalidError);
  });

  it('forward-parses unknown record kinds with a WARN', async () => {
    const buffer = createCassetteBufferSink();
    const writer = createToolCassetteWriter(buffer.sink, {
      writer: 'fake',
      sessionId: 'sess-1',
      runId: 'run-1',
    });
    await writer.writeRecord({
      kind: 'tool-call',
      stepNumber: 1,
      toolCallId: 'tc-1',
      toolName: 'pure',
      sideEffectClass: 'pure',
      args: {},
      output: { ok: true },
      status: 'completed',
      durationMs: 1,
      agentId: 'main',
      timestampIso: '2026-05-08T10:00:00Z',
    });
    // Inject an unknown kind directly into the body.
    await buffer.sink.write(
      `${JSON.stringify({ kind: 'experimental-future-event', detail: 'TBD' })}\n`,
    );
    await writer.close();
    const parsed = readToolCassette(buffer.toString());
    expect(parsed.records.some((r) => r.kind === 'unknown')).toBe(true);
    expect(parsed.warnings.some((w) => w.kind === 'unknown-record')).toBe(true);
    // The known `tool-call` record must still parse cleanly.
    expect(parsed.toolCalls).toHaveLength(1);
    expect(parsed.toolCalls[0]?.toolName).toBe('pure');
  });
});

describe('Cassette decision engine — sideEffectClass policy', () => {
  const baseRecord = {
    kind: 'tool-call' as const,
    stepNumber: 1,
    toolCallId: 'tc-1',
    args: { q: 'hello' },
    output: { ok: true },
    status: 'completed' as const,
    durationMs: 1,
    agentId: 'main',
    timestampIso: '2026-05-08T10:00:00Z',
    sha256OfArgs: sha256OfValue({ q: 'hello' }),
  } satisfies Omit<ToolCallRecord, 'toolName' | 'sideEffectClass'>;

  it('substitutes pure tools under auto', () => {
    const decision = decideToolReplay(
      { ...baseRecord, toolName: 'pure-tool', sideEffectClass: 'pure' },
      { toolName: 'pure-tool', args: { q: 'hello' } },
      { mode: 'auto' },
    );
    expect(decision.type).toBe('tool.cassette.replay.substituted');
    if (decision.type === 'tool.cassette.replay.substituted') {
      expect(decision.reason).toBe('auto-policy');
    }
  });

  it('substitutes read-only tools under auto', () => {
    const decision = decideToolReplay(
      { ...baseRecord, toolName: 'wiki-search', sideEffectClass: 'read-only' },
      { toolName: 'wiki-search', args: { q: 'hello' } },
      { mode: 'auto' },
    );
    expect(decision.type).toBe('tool.cassette.replay.substituted');
  });

  it('re-executes side-effecting tools under auto with INFO', () => {
    const decision = decideToolReplay(
      { ...baseRecord, toolName: 'send-email', sideEffectClass: 'side-effecting' },
      { toolName: 'send-email', args: { q: 'hello' } },
      { mode: 'auto' },
    );
    expect(decision.type).toBe('tool.cassette.replay.live');
    if (decision.type === 'tool.cassette.replay.live') {
      expect(decision.warnLevel).toBe('INFO');
      expect(decision.reason).toBe('auto-policy');
    }
  });

  it('re-executes external-stateful tools under auto with WARN-non-silenceable', () => {
    const decision = decideToolReplay(
      { ...baseRecord, toolName: 'linear-create-issue', sideEffectClass: 'external-stateful' },
      { toolName: 'linear-create-issue', args: { q: 'hello' } },
      { mode: 'auto' },
    );
    expect(decision.type).toBe('tool.cassette.replay.live');
    if (decision.type === 'tool.cassette.replay.live') {
      expect(decision.warnLevel).toBe('WARN-non-silenceable');
      expect(decision.reason).toBe('auto-policy-safety-gate');
    }
  });

  it('"recorded" mode forces substitution even on external-stateful', () => {
    const decision = decideToolReplay(
      { ...baseRecord, toolName: 'linear-create-issue', sideEffectClass: 'external-stateful' },
      { toolName: 'linear-create-issue', args: { q: 'hello' } },
      { mode: 'recorded' },
    );
    expect(decision.type).toBe('tool.cassette.replay.substituted');
  });

  it('"live" mode bypasses the cassette for everything', () => {
    const decision = decideToolReplay(
      { ...baseRecord, toolName: 'pure-tool', sideEffectClass: 'pure' },
      { toolName: 'pure-tool', args: { q: 'hello' } },
      { mode: 'live' },
    );
    expect(decision.type).toBe('tool.cassette.replay.live');
    if (decision.type === 'tool.cassette.replay.live') {
      expect(decision.reason).toBe('live-mode-forced');
    }
  });

  it('"mixed" mode honours per-tool overrides', () => {
    const recordedDecision = decideToolReplay(
      { ...baseRecord, toolName: 'send-email', sideEffectClass: 'side-effecting' },
      { toolName: 'send-email', args: { q: 'hello' } },
      { mode: 'mixed', perToolMode: { 'send-email': 'recorded' } },
    );
    expect(recordedDecision.type).toBe('tool.cassette.replay.substituted');

    const liveDecision = decideToolReplay(
      { ...baseRecord, toolName: 'pure-tool', sideEffectClass: 'pure' },
      { toolName: 'pure-tool', args: { q: 'hello' } },
      { mode: 'mixed', perToolMode: { 'pure-tool': 'live' } },
    );
    expect(liveDecision.type).toBe('tool.cassette.replay.live');
  });

  it('detects an idempotency mismatch and surfaces it on continue-with-recorded by default', () => {
    const decision = decideToolReplay(
      { ...baseRecord, toolName: 'pure-tool', sideEffectClass: 'pure' },
      { toolName: 'pure-tool', args: { q: 'changed' } },
      { mode: 'auto' },
    );
    expect(decision.type).toBe('tool.cassette.replay.idempotency-mismatch');
    if (decision.type === 'tool.cassette.replay.idempotency-mismatch') {
      expect(decision.decision).toBe('continue-with-recorded');
    }
  });

  it('throws when failOnIdempotencyMismatch is true', () => {
    expect(() =>
      decideToolReplay(
        { ...baseRecord, toolName: 'pure-tool', sideEffectClass: 'pure' },
        { toolName: 'pure-tool', args: { q: 'changed' } },
        { mode: 'auto', failOnIdempotencyMismatch: true },
      ),
    ).toThrow(CassetteIdempotencyMismatchError);
  });
});

describe('Tool cassette recorder — flushToFile', () => {
  let tmpDir: string;
  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'graphorin-cassette-'));
  });
  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes the cassette to disk and returns the summary', async () => {
    const outputPath = join(tmpDir, 'cassette.jsonl');
    const recorder = createToolCassetteRecorder({
      writer: '@graphorin/sessions@0.1.0',
      sessionId: 'sess-1',
      runId: 'run-1',
      outputPath,
      hash: true,
    });
    await recorder.recordToolCall({
      stepNumber: 1,
      toolCallId: 'tc-1',
      toolName: 'pure-tool',
      sideEffectClass: 'pure',
      args: { q: 'q' },
      output: { ok: true },
      status: 'completed',
      durationMs: 10,
      agentId: 'main',
      timestampIso: '2026-05-08T10:00:00Z',
    });
    const summary = await recorder.flushToFile();
    expect(existsSync(outputPath)).toBe(true);
    expect(summary.path).toBe(outputPath);
    const body = readFileSync(outputPath, 'utf8');
    const parsed = readToolCassette(body);
    expect(parsed.toolCalls).toHaveLength(1);
    const tc = parsed.toolCalls[0] as ToolCallRecord;
    expect(tc.sha256OfArgs).toMatch(/^[a-f0-9]{64}$/);
    expect(tc.sha256OfOutput).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('cassette replay event ordering', () => {
  it('sample sequence: substitution + live decisions correlate with sideEffectClass', () => {
    const records: ToolCallRecord[] = [
      {
        kind: 'tool-call',
        stepNumber: 1,
        toolCallId: 'tc-1',
        toolName: 'pure',
        sideEffectClass: 'pure',
        args: {},
        output: { ok: true },
        status: 'completed',
        durationMs: 1,
        agentId: 'main',
        timestampIso: '2026-05-08T10:00:00Z',
        sha256OfArgs: sha256OfValue({}),
      },
      {
        kind: 'tool-call',
        stepNumber: 2,
        toolCallId: 'tc-2',
        toolName: 'ext',
        sideEffectClass: 'external-stateful',
        args: {},
        output: { ok: true },
        status: 'completed',
        durationMs: 1,
        agentId: 'main',
        timestampIso: '2026-05-08T10:00:00Z',
        sha256OfArgs: sha256OfValue({}),
      },
    ];
    const decisions: CassetteReplayDecision[] = records.map((r) =>
      decideToolReplay(r, { toolName: r.toolName, args: r.args }, { mode: 'auto' }),
    );
    expect(decisions[0]?.type).toBe('tool.cassette.replay.substituted');
    expect(decisions[1]?.type).toBe('tool.cassette.replay.live');
  });
});
