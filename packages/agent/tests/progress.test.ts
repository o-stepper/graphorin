import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createProgressIO, ProgressWriteError } from '../src/index.js';

describe('createProgressIO', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'graphorin-agent-progress-'));
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it('writes an artifact and reads it back', async () => {
    const io = createProgressIO({ artifactRoot: tmp });
    const ref = await io.write('run-1', 'Phase 1 plan', { role: 'planner' });
    expect(ref.path).toMatch(/planner\.001\.txt$/);
    expect(ref.role).toBe('planner');
    expect(ref.seq).toBe(1);
    expect(ref.sha256).toMatch(/^[0-9a-f]{64}$/);

    const refs = await io.read('run-1', { role: 'planner' });
    expect(refs.length).toBe(1);
    expect(refs[0]?.path).toBe(ref.path);
  });

  it('auto-increments sequence per (runId, role)', async () => {
    const io = createProgressIO({ artifactRoot: tmp });
    const a = await io.write('r', 'one', { role: 'planner' });
    const b = await io.write('r', 'two', { role: 'planner' });
    expect(a.seq).toBe(1);
    expect(b.seq).toBe(2);
  });

  it('cross-run reads require an explicit runId cursor', async () => {
    const io = createProgressIO({ artifactRoot: tmp });
    await io.write('run-old', 'old plan', { role: 'planner' });
    const fromCurrent = await io.read('run-new');
    expect(fromCurrent.length).toBe(0);
    const cross = await io.read('run-new', { runId: 'run-old' });
    expect(cross.length).toBe(1);
  });

  it('respects sinceSeq', async () => {
    const io = createProgressIO({ artifactRoot: tmp });
    await io.write('r', 'one', { role: 'planner' });
    await io.write('r', 'two', { role: 'planner' });
    await io.write('r', 'three', { role: 'planner' });
    const refs = await io.read('r', { sinceSeq: 1 });
    expect(refs.map((r) => r.seq)).toEqual([2, 3]);
  });

  it('runs the redact transform on the write path', async () => {
    const io = createProgressIO({
      artifactRoot: tmp,
      redact: (s) => s.replace(/SECRET-\w+/g, '[REDACTED]'),
    });
    const ref = await io.write('r', 'value=SECRET-abc123', { role: 'planner' });
    const refs = await io.read('r', { role: 'planner' });
    expect(refs.length).toBe(1);
    expect(ref.sha256).not.toBe('');
  });

  it('surfaces ProgressWriteError on filesystem failure', async () => {
    // POSIX trick: `/dev/null` is a character device, so attempting
    // to create a file *under* it (`/dev/null/nope/...`) reliably
    // fails with ENOTDIR. Windows has no analogous device path —
    // the closest equivalent (`NUL\\nope`) is silently swallowed by
    // Node's fs layer, so we use a path containing characters that
    // Windows reserves and refuses to create. The intent of the
    // assertion (the IO surfaces filesystem failures as
    // `ProgressWriteError`) is preserved on both platforms; only
    // the specific provocation differs.
    const artifactRoot =
      process.platform === 'win32'
        ? // Reserved characters `<>` are rejected by NTFS at mkdir
          // time on every Node version, so the underlying recursive
          // mkdir throws EINVAL and the IO wraps it.
          'C:\\graphorin-test-<invalid>\\nope'
        : '/dev/null/nope';
    const io = createProgressIO({ artifactRoot });
    await expect(async () => io.write('r', 'x', { role: 'p' })).rejects.toThrowError(
      ProgressWriteError,
    );
  });
});

describe('agent.progress events (AG-20)', () => {
  it('progress.write/read queue agent.progress.written/read events, delivered on the run stream', async () => {
    const { createAgent } = await import('../src/index.js');
    const { createMockProvider, textOnlyScript } = await import('./fixtures/mock-provider.js');
    const agent = createAgent({
      name: 'progressor',
      instructions: 'noop',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('ok', 4)] }),
    });
    const ref = await agent.progress.write('Phase 1 done', { role: 'planner' });
    expect(ref.sha256).toMatch(/^[0-9a-f]{64}$/);
    // No runId supplied: out-of-run write/read share the agent's stable
    // fallback id, so the read finds what the write just persisted.
    const refs = await agent.progress.read({ role: 'planner' });
    expect(refs.length).toBe(1);

    // The events queue on the external-event queue and drain into the
    // next consumed stream.
    const events: import('@graphorin/core').AgentEvent[] = [];
    for await (const ev of agent.stream('hi')) {
      events.push(ev);
    }
    const written = events.find((e) => e.type === 'agent.progress.written');
    expect(written).toBeDefined();
    if (written?.type === 'agent.progress.written') {
      expect(written.ref.sha256).toBe(ref.sha256);
      expect(written.agentId).toBe(agent.id);
    }
    const read = events.find((e) => e.type === 'agent.progress.read');
    expect(read).toBeDefined();
    if (read?.type === 'agent.progress.read' && written?.type === 'agent.progress.written') {
      expect(read.refs.length).toBe(1);
      expect(read.queriedRunId).toBe(written.runId);
      expect(read.queriedRole).toBe('planner');
    }
  });
});
