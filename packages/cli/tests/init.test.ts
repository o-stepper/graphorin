import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runInit } from '../src/commands/init.js';

async function fixtureDir(): Promise<string> {
  return await mkdtemp(join(tmpdir(), 'graphorin-cli-init-'));
}

describe('runInit', () => {
  it('writes a config file and prints the bootstrap material in non-interactive mode', async () => {
    const dir = await fixtureDir();
    const lines: string[] = [];
    const result = await runInit({
      cwd: dir,
      nonInteractive: true,
      cloudConsent: 'public-only',
      encrypted: false,
      print: (line) => {
        lines.push(line);
      },
    });
    expect(result.configPath).toBe(join(dir, 'graphorin.config.ts'));
    expect(result.cloudConsent).toBe('public-only');
    expect(result.storageEncrypted).toBe(false);
    expect(result.serverPepperHex).toMatch(/^[0-9a-f]+$/);
    const written = await readFile(result.configPath, 'utf8');
    expect(written).toContain("import { defineConfig } from '@graphorin/server';");
    expect(written).toContain("source: 'auto'");
    expect(written).toContain('public-only');
    const joined = lines.join('\n');
    // W-003: no phantom credential. Init cannot mint a verifiable token
    // (that needs migrations + the persisted pepper), so it must not
    // print one that is guaranteed to 401.
    expect(joined).not.toContain('gph_live_v1_');
    expect(joined).not.toContain('bootstrap admin token');
    // Next-steps walk the WORKING path: stdin pepper -> migrate ->
    // token create -> start.
    expect(joined).toContain('--from-stdin');
    expect(joined).toContain('graphorin token create');
    // W-041: the pepper never appears as an argv value in the guidance.
    expect(joined).not.toMatch(/secrets set \S+ --value/);
    // The pepper hex itself is printed exactly once, and never lands in
    // the config file.
    const pepperLines = lines.filter((l) => l.includes(result.serverPepperHex));
    expect(pepperLines).toHaveLength(1);
    expect(written).not.toContain(result.serverPepperHex);
  });

  it('refuses to overwrite an existing config file', async () => {
    const dir = await fixtureDir();
    await runInit({
      cwd: dir,
      nonInteractive: true,
      cloudConsent: 'public-only',
      encrypted: false,
      print: () => {},
    });
    await expect(
      runInit({
        cwd: dir,
        nonInteractive: true,
        cloudConsent: 'public-only',
        encrypted: false,
        print: () => {},
      }),
    ).rejects.toThrow(/refusing to overwrite/);
  });

  it('returns the right defaults from environment variables', async () => {
    const dir = await fixtureDir();
    process.env.GRAPHORIN_CLOUD_CONSENT = 'all-with-warnings';
    process.env.GRAPHORIN_STORAGE_ENCRYPTED = '1';
    try {
      const result = await runInit({
        cwd: dir,
        nonInteractive: true,
        print: () => {},
      });
      expect(result.cloudConsent).toBe('all-with-warnings');
      expect(result.storageEncrypted).toBe(true);
    } finally {
      delete process.env.GRAPHORIN_CLOUD_CONSENT;
      delete process.env.GRAPHORIN_STORAGE_ENCRYPTED;
    }
  });

  it('dryRun does not touch the filesystem', async () => {
    const dir = await fixtureDir();
    const result = await runInit({
      cwd: dir,
      nonInteractive: true,
      cloudConsent: 'public-only',
      encrypted: false,
      dryRun: true,
      print: () => {},
    });
    await expect(readFile(result.configPath, 'utf8')).rejects.toThrow();
  });
});

describe('IP-5 - init output parses through the strict server schema', () => {
  it('renderConfig round-trips parseServerConfig with zero unrecognized keys', async () => {
    const { mkdtemp } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { readFile } = await import('node:fs/promises');
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-init-rt-'));
    const { runInit } = await import('../src/commands/init.js');
    const result = await runInit({
      cwd: dir,
      nonInteractive: true,
      cloudConsent: 'public-only',
      encrypted: false,
      print: () => {},
    } as never);
    const raw = await readFile(result.configPath, 'utf8');
    expect(raw).not.toContain('defaults:');
    // The generated config (a TS module: defineConfig({...})) must
    // satisfy the STRICT parser - extract the object literal and
    // evaluate it (the file itself is TS, not directly importable).
    const objSource = raw.slice(
      raw.indexOf('defineConfig(') + 'defineConfig('.length,
      raw.lastIndexOf(')'),
    );
    // biome-ignore lint/security/noGlobalEval: test-only evaluation of our own generated literal
    // biome-ignore lint/complexity/noCommaOperator: indirect eval is the point - evaluate in global scope
    const cfg = (0, eval)(`(${objSource})`);
    const { parseServerConfig } = await import('@graphorin/server');
    expect(() => parseServerConfig(cfg)).not.toThrow();
  });
});
