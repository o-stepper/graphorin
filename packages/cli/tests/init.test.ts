import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runInit } from '../src/commands/init.js';
import { shellQuotePath } from '../src/internal/output.js';

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

  it('F-05: --format json writes a defineConfig-free graphorin.config.json', async () => {
    const dir = await fixtureDir();
    const result = await runInit({
      cwd: dir,
      format: 'json',
      nonInteractive: true,
      cloudConsent: 'public-only',
      encrypted: true,
      print: () => {},
    });
    expect(result.configPath).toBe(join(dir, 'graphorin.config.json'));
    const raw = await readFile(result.configPath, 'utf8');
    expect(raw).not.toContain('defineConfig');
    const cfg = JSON.parse(raw);
    expect(cfg.storage.encryption.enabled).toBe(true);
    expect(cfg.audit.enabled).toBe(true);
    const { parseServerConfig } = await import('@graphorin/server');
    expect(() => parseServerConfig(cfg)).not.toThrow();
  });

  it('F-05: the json flavour is inferred from a .json --out', async () => {
    const dir = await fixtureDir();
    const result = await runInit({
      cwd: dir,
      out: 'custom.json',
      nonInteractive: true,
      cloudConsent: 'public-only',
      encrypted: false,
      print: () => {},
    });
    expect(result.configPath).toBe(join(dir, 'custom.json'));
    const raw = await readFile(result.configPath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('F-05: refuses a --format that contradicts the --out extension', async () => {
    const dir = await fixtureDir();
    await expect(
      runInit({
        cwd: dir,
        format: 'json',
        out: 'graphorin.config.ts',
        nonInteractive: true,
        cloudConsent: 'public-only',
        encrypted: false,
        print: () => {},
      }),
    ).rejects.toThrow(/--format json requires an --out ending in '\.json'/);
    await expect(
      runInit({
        cwd: dir,
        format: 'ts',
        out: 'graphorin.config.json',
        nonInteractive: true,
        cloudConsent: 'public-only',
        encrypted: false,
        print: () => {},
      }),
    ).rejects.toThrow(/--format ts conflicts/);
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

describe('P1-4 (deep retest 2026-07-19) - the consent tier is actionable, not decorative', () => {
  it('next-steps print the tier and the exact createMemory enforcement snippet', async () => {
    const dir = await fixtureDir();
    const lines: string[] = [];
    await runInit({
      cwd: dir,
      nonInteractive: true,
      cloudConsent: 'public-and-internal',
      encrypted: false,
      print: (line) => {
        lines.push(line);
      },
    });
    const out = lines.join('\n');
    expect(out).toContain("Enforce your cloud-consent tier ('public-and-internal')");
    expect(out).toContain('cloudUploadConsent: true');
    expect(out).toContain("acceptsSensitivity: ['public', 'internal']");
  });

  it('the .ts config embeds the same snippet as a comment; JSON relies on the printed steps', async () => {
    const tsDir = await fixtureDir();
    const tsLines: string[] = [];
    const ts = await runInit({
      cwd: tsDir,
      nonInteractive: true,
      cloudConsent: 'all-with-warnings',
      encrypted: false,
      format: 'ts',
      print: (l) => {
        tsLines.push(l);
      },
    });
    const tsBody = await readFile(ts.configPath, 'utf8');
    expect(tsBody).toContain("'all-with-warnings'");
    expect(tsBody).toContain('cloudUploadConsent: true');
    expect(tsBody).toContain("acceptsSensitivity: ['public', 'internal', 'secret']");

    const jsonDir = await fixtureDir();
    const jsonLines: string[] = [];
    const json = await runInit({
      cwd: jsonDir,
      nonInteractive: true,
      cloudConsent: 'public-only',
      encrypted: false,
      format: 'json',
      print: (l) => {
        jsonLines.push(l);
      },
    });
    const jsonBody = await readFile(json.configPath, 'utf8');
    expect(() => JSON.parse(jsonBody)).not.toThrow();
    expect(jsonLines.join('\n')).toContain('fail-closed default');
  });
});

describe('deep-retest 0.13.1 P3 - copy/paste-safe next-step hints', () => {
  it('quotes the config path in migrate/start hints when the directory has a space + apostrophe', async () => {
    const base = await fixtureDir();
    const dir = join(base, "it's a space dir");
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
    const joined = lines.join('\n');
    // Platform-family quoting: POSIX single quotes, Windows double
    // quotes. Either way the spaced path MUST come out quoted.
    const quoted = shellQuotePath(result.configPath);
    expect(quoted).not.toBe(result.configPath);
    expect(joined).toContain(`graphorin migrate --config ${quoted}`);
    expect(joined).toContain(`graphorin start --config ${quoted}`);
    // The raw, unquoted path must not appear inside a command hint - a
    // literal paste would truncate at the first space.
    expect(joined).not.toContain(`--config ${result.configPath}\``);
  });

  it('leaves ordinary absolute paths unquoted (pretty hints stay pretty)', async () => {
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
    expect(lines.join('\n')).toContain(`graphorin migrate --config ${result.configPath}\``);
  });
});

describe('shellQuotePath', () => {
  it.skipIf(process.platform === 'win32')(
    'POSIX: passes safe paths through and single-quotes the rest',
    () => {
      expect(shellQuotePath('/opt/graphorin/graphorin.config.ts')).toBe(
        '/opt/graphorin/graphorin.config.ts',
      );
      expect(shellQuotePath('/tmp/space dir/config.json')).toBe("'/tmp/space dir/config.json'");
      expect(shellQuotePath("/tmp/it's here/config.json")).toBe("'/tmp/it'\\''s here/config.json'");
      expect(shellQuotePath('')).toBe("''");
    },
  );

  it.runIf(process.platform === 'win32')(
    'Windows: backslash paths stay unquoted; spaced paths get double quotes',
    () => {
      expect(shellQuotePath('C:\\Users\\dev\\graphorin.config.ts')).toBe(
        'C:\\Users\\dev\\graphorin.config.ts',
      );
      expect(shellQuotePath('C:\\space dir\\config.json')).toBe('"C:\\space dir\\config.json"');
      expect(shellQuotePath("C:\\it's here\\config.json")).toBe('"C:\\it\'s here\\config.json"');
      expect(shellQuotePath('')).toBe('""');
    },
  );
});
