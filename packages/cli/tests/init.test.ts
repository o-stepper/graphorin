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
    expect(result.bootstrapToken).toMatch(/^gph_live_v1_/);
    expect(result.serverPepperHex).toMatch(/^[0-9a-f]+$/);
    const written = await readFile(result.configPath, 'utf8');
    expect(written).toContain("import { defineConfig } from '@graphorin/server';");
    expect(written).toContain("source: 'auto'");
    expect(written).toContain('public-only');
    // Bootstrap token + pepper appear in the printed lines, never in the file.
    expect(lines.some((l) => l.includes(result.bootstrapToken))).toBe(true);
    expect(written).not.toContain(result.bootstrapToken);
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
