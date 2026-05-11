import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/internal/load-config.js';

async function fixtureDir(): Promise<string> {
  return await mkdtemp(join(tmpdir(), 'graphorin-cli-'));
}

describe('loadConfig', () => {
  it('reads a JSON config file when path is supplied', async () => {
    const dir = await fixtureDir();
    const path = join(dir, 'config.json');
    await writeFile(path, JSON.stringify({ server: { port: 1234 } }), 'utf8');
    const loaded = await loadConfig(path);
    expect(loaded.path).toBe(resolve(path));
    expect((loaded.config as { server?: { port?: number } }).server?.port).toBe(1234);
  });

  it('throws when the supplied path does not exist', async () => {
    await expect(loadConfig('/definitely/does/not/exist.json')).rejects.toThrow();
  });

  it('falls back to the first existing default in the cwd', async () => {
    const dir = await fixtureDir();
    await mkdir(dir, { recursive: true });
    const target = join(dir, 'graphorin.config.json');
    await writeFile(target, JSON.stringify({ server: { host: '0.0.0.0' } }), 'utf8');
    const loaded = await loadConfig(undefined, { cwd: dir });
    expect(loaded.path).toBe(target);
    expect((loaded.config as { server?: { host?: string } }).server?.host).toBe('0.0.0.0');
  });

  it('throws a helpful error when no default file is present', async () => {
    const dir = await fixtureDir();
    await expect(loadConfig(undefined, { cwd: dir })).rejects.toThrow(/no config file found/);
  });
});
