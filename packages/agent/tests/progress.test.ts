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
    const io = createProgressIO({ artifactRoot: '/dev/null/nope' });
    await expect(async () => io.write('r', 'x', { role: 'p' })).rejects.toThrowError(
      ProgressWriteError,
    );
  });
});
