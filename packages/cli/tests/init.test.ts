import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

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

describe('deep-retest-0.13.11 - CI-safe pepper handling (--pepper-out)', () => {
  it('writes the pepper to the file (0600) and never prints the hex', async () => {
    const dir = await fixtureDir();
    const lines: string[] = [];
    const pepperOut = join(dir, 'secrets', 'pepper.hex');
    const result = await runInit({
      cwd: dir,
      nonInteractive: true,
      cloudConsent: 'public-only',
      encrypted: false,
      pepperOut,
      print: (line) => {
        lines.push(line);
      },
    });
    expect(result.pepperOutPath).toBe(pepperOut);
    const written = (await readFile(pepperOut, 'utf8')).trim();
    expect(written).toBe(result.serverPepperHex);
    if (process.platform !== 'win32') {
      const mode = (await stat(pepperOut)).mode & 0o777;
      expect(mode).toBe(0o600);
    }
    const joined = lines.join('\n');
    // The key material must never reach the terminal/CI log.
    expect(joined).not.toContain(result.serverPepperHex);
    expect(joined).toContain('not printed');
    // Step 1 walks the file-based path and tells the operator to
    // delete the file afterwards.
    expect(joined).toContain('--from-stdin <');
    expect(joined).toContain('delete the file');
  });

  it('refuses to overwrite an existing pepper-out file', async () => {
    const dir = await fixtureDir();
    const pepperOut = join(dir, 'pepper.hex');
    await writeFile(pepperOut, 'stale', 'utf8');
    await expect(
      runInit({
        cwd: dir,
        nonInteractive: true,
        cloudConsent: 'public-only',
        encrypted: false,
        pepperOut,
        print: () => undefined,
      }),
    ).rejects.toThrow(/refusing to overwrite/);
    // The stale file is untouched.
    expect(await readFile(pepperOut, 'utf8')).toBe('stale');
  });
});

describe('shellQuotePath', () => {
  // The explicit platform argument is the test seam: both branches run
  // on every OS, so the linux coverage leg exercises the win32 scan too.
  it('POSIX: passes safe paths through and single-quotes the rest', () => {
    expect(shellQuotePath('/opt/graphorin/graphorin.config.ts', 'linux')).toBe(
      '/opt/graphorin/graphorin.config.ts',
    );
    expect(shellQuotePath('/tmp/space dir/config.json', 'linux')).toBe(
      "'/tmp/space dir/config.json'",
    );
    expect(shellQuotePath("/tmp/it's here/config.json", 'darwin')).toBe(
      "'/tmp/it'\\''s here/config.json'",
    );
    expect(shellQuotePath('', 'linux')).toBe("''");
  });

  it('Windows: backslash paths stay unquoted; spaced paths get double quotes', () => {
    expect(shellQuotePath('C:\\Users\\dev\\graphorin.config.ts', 'win32')).toBe(
      'C:\\Users\\dev\\graphorin.config.ts',
    );
    expect(shellQuotePath('C:\\space dir\\config.json', 'win32')).toBe(
      '"C:\\space dir\\config.json"',
    );
    expect(shellQuotePath("C:\\it's here\\config.json", 'win32')).toBe(
      '"C:\\it\'s here\\config.json"',
    );
    expect(shellQuotePath('', 'win32')).toBe('""');
    // MSVCRT argv rules: a trailing backslash run doubles so it cannot
    // swallow the closing quote, and backslashes before an embedded
    // quote double ahead of the escaped quote.
    expect(shellQuotePath('C:\\space dir\\', 'win32')).toBe('"C:\\space dir\\\\"');
    expect(shellQuotePath('C:\\we"ird', 'win32')).toBe('"C:\\we\\"ird"');
    expect(shellQuotePath('C:\\x\\"y z', 'win32')).toBe('"C:\\x\\\\\\"y z"');
  });

  it('defaults to the ambient platform', () => {
    const ambient = shellQuotePath('/plain/path.json');
    expect(ambient).toBe(shellQuotePath('/plain/path.json', process.platform));
  });
});
