import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  runAuthList,
  runAuthLogin,
  runAuthRefresh,
  runAuthRevoke,
  runAuthStatus,
} from '../src/commands/auth.js';

async function fixture(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-auth-'));
  const cfg = join(dir, 'graphorin.config.json');
  await writeFile(
    cfg,
    JSON.stringify({
      storage: { path: join(dir, 'data.db'), mode: 'lib' },
      auth: { kind: 'none' },
    }),
    'utf8',
  );
  return cfg;
}

describe('graphorin auth', () => {
  it('list reports no sessions on a fresh DB', async () => {
    const cfg = await fixture();
    const lines: string[] = [];
    const result = await runAuthList({ config: cfg, print: (l) => lines.push(l) });
    expect(result).toEqual([]);
  });

  it('status returns the empty snapshot on a fresh DB', async () => {
    const cfg = await fixture();
    const status = await runAuthStatus({ config: cfg, print: () => undefined });
    expect(status.sessions).toEqual([]);
  });

  it('login + refresh + revoke refuse with GRAPHORIN_OFFLINE=1', async () => {
    const cfg = await fixture();
    process.env.GRAPHORIN_OFFLINE = '1';
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    try {
      await expect(
        runAuthLogin({
          config: cfg,
          serverUrl: 'https://example.com/oauth',
          print: () => undefined,
        }),
      ).rejects.toThrow();
      await expect(
        runAuthRefresh({
          config: cfg,
          id: 'missing',
          print: () => undefined,
        }),
      ).rejects.toThrow();
      // AUTH-CLI-01: revoke makes an outbound RFC 7009 call and must refuse
      // offline too (it used to POST the live token regardless).
      await expect(
        runAuthRevoke({
          config: cfg,
          id: 'missing',
          print: () => undefined,
        }),
      ).rejects.toThrow();
    } finally {
      delete process.env.GRAPHORIN_OFFLINE;
      exit.mockRestore();
    }
  });
});
