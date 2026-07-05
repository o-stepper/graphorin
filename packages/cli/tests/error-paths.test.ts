import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { runMigrate } from '../src/commands/migrate.js';
import { runStart } from '../src/commands/start.js';

async function fixture(): Promise<string> {
  return await mkdtemp(join(tmpdir(), 'graphorin-cli-err-'));
}

describe('runMigrate - error paths', () => {
  it('exits 1 when the config file does not exist', async () => {
    const lines: string[] = [];
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    try {
      await expect(
        runMigrate({
          config: '/definitely/missing.json',
          print: (line) => {
            lines.push(line);
          },
        }),
      ).rejects.toThrow();
    } finally {
      exit.mockRestore();
    }
    expect(lines.join('\n')).toContain('not found');
  });

  it('exits 1 when the config fails Zod validation', async () => {
    const dir = await fixture();
    const path = join(dir, 'graphorin.config.json');
    await writeFile(path, JSON.stringify({ server: { port: -1 } }), 'utf8');
    const lines: string[] = [];
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    try {
      await expect(
        runMigrate({
          config: path,
          print: (line) => {
            lines.push(line);
          },
        }),
      ).rejects.toThrow();
    } finally {
      exit.mockRestore();
    }
    expect(lines.join('\n')).toMatch(/graphorin\.config|invalid/i);
  });

  it('emits a notice when --target is supplied (Phase 15 reservation)', async () => {
    const dir = await fixture();
    const cfg = join(dir, 'graphorin.config.json');
    await writeFile(
      cfg,
      JSON.stringify({
        storage: { path: join(dir, 'data.db'), mode: 'lib' },
        auth: { kind: 'none' },
      }),
      'utf8',
    );
    const lines: string[] = [];
    await runMigrate({
      config: cfg,
      target: '003',
      print: (line) => {
        lines.push(line);
      },
    });
    expect(lines.some((l) => l.includes('--target'))).toBe(true);
  });
});

describe('runStart - error paths', () => {
  it('exits 1 + prints config-invalid when the config schema rejects', async () => {
    const dir = await fixture();
    const cfg = join(dir, 'graphorin.config.json');
    await writeFile(cfg, JSON.stringify({ server: { port: -1 } }), 'utf8');
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    const writes: string[] = [];
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation((data) => {
      writes.push(typeof data === 'string' ? data : Buffer.from(data).toString('utf8'));
      return true;
    });
    try {
      await expect(
        runStart({
          config: cfg,
          logResolved: false,
        }),
      ).rejects.toThrow();
    } finally {
      exit.mockRestore();
      writeSpy.mockRestore();
    }
    expect(writes.join('')).toMatch(/graphorin\.config invalid/);
  });

  it('exits 1 + prints the typed kind on a pre-bind failure', async () => {
    const dir = await fixture();
    const cfg = join(dir, 'graphorin.config.json');
    await writeFile(
      cfg,
      JSON.stringify({
        // Token auth without a pepperRef → PrebindPepperMissingError.
        auth: { kind: 'token' },
        storage: { path: join(dir, 'data.db'), mode: 'lib' },
      }),
      'utf8',
    );
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    const writes: string[] = [];
    const writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation((data) => {
      writes.push(typeof data === 'string' ? data : Buffer.from(data).toString('utf8'));
      return true;
    });
    try {
      await expect(
        runStart({
          config: cfg,
          logResolved: false,
        }),
      ).rejects.toThrow();
    } finally {
      exit.mockRestore();
      writeSpy.mockRestore();
    }
    const output = writes.join('');
    expect(output).toContain('pre-bind-pepper-missing');
    expect(output).toContain('hint:');
  });
});
