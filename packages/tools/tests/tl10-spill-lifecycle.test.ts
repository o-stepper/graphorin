import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createDefaultSpillWriter } from '../src/result/index.js';

const tmpRoots: string[] = [];
afterEach(async () => {
  while (tmpRoots.length > 0) {
    const root = tmpRoots.pop();
    if (root !== undefined) await fs.rm(root, { recursive: true, force: true }).catch(() => {});
  }
});

async function isolatedRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'graphorin-tl10-'));
  tmpRoots.push(root);
  return root;
}

async function exists(p: string): Promise<boolean> {
  return fs.stat(p).then(
    () => true,
    () => false,
  );
}

describe('TL-10 — spill artifact lifecycle', () => {
  it('clear(runId) removes exactly that run directory', async () => {
    const root = await isolatedRoot();
    const writer = createDefaultSpillWriter({ root, startupSweepTtlMs: false });
    await writer.write({ runId: 'run-a', toolCallId: 'c1', extension: 'txt', body: 'aaa' });
    await writer.write({ runId: 'run-b', toolCallId: 'c1', extension: 'txt', body: 'bbb' });

    await writer.clear?.('run-a');
    expect(await exists(path.join(root, 'run-a'))).toBe(false);
    expect(await exists(path.join(root, 'run-b'))).toBe(true);
  });

  it('clear() refuses a run id that escapes the artifact root', async () => {
    const root = await isolatedRoot();
    const writer = createDefaultSpillWriter({ root, startupSweepTtlMs: false });
    const sibling = await isolatedRoot();
    await fs.writeFile(path.join(sibling, 'precious.txt'), 'keep me');
    await writer.clear?.(path.join('..', path.basename(sibling)));
    expect(await exists(path.join(sibling, 'precious.txt'))).toBe(true);
  });

  it('sweep(ttl) removes only run directories older than the TTL', async () => {
    const root = await isolatedRoot();
    const writer = createDefaultSpillWriter({ root, startupSweepTtlMs: false });
    await writer.write({ runId: 'old-run', toolCallId: 'c1', extension: 'txt', body: 'old' });
    await writer.write({ runId: 'fresh-run', toolCallId: 'c1', extension: 'txt', body: 'new' });
    // Age the old run directory two hours into the past.
    const aged = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await fs.utimes(path.join(root, 'old-run'), aged, aged);

    const removed = await writer.sweep?.(60 * 60 * 1000); // 1h TTL
    expect(removed).toBe(1);
    expect(await exists(path.join(root, 'old-run'))).toBe(false);
    expect(await exists(path.join(root, 'fresh-run'))).toBe(true);
  });
});
