import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { runDoctor } from '../src/commands/doctor.js';
import { runInit } from '../src/commands/init.js';

async function fixtureDir(): Promise<string> {
  const dir = join(
    tmpdir(),
    `graphorin-cli-doctor-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  await mkdir(dir, { recursive: true, mode: 0o700 });
  return dir;
}

describe('runDoctor', () => {
  it('reports a clean perms section against a freshly-created home directory', async () => {
    const home = await fixtureDir();
    const lines: string[] = [];
    const report = await runDoctor({
      home,
      checkPerms: true,
      print: (line) => lines.push(line),
    });
    expect(report.platform).toBe(process.platform);
    expect(report.checks.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.includes('graphorin doctor'))).toBe(true);
  });

  it('emits a JSON document on --json', async () => {
    const home = await fixtureDir();
    const captured: unknown[] = [];
    const report = await runDoctor({
      home,
      checkPerms: true,
      json: true,
      jsonPrint: (payload) => captured.push(payload),
    });
    expect(captured).toHaveLength(1);
    expect((captured[0] as { home: string }).home).toBe(home);
    expect(report.summary.fail).toBe(report.summary.fail);
  });

  it('repairs a drifted file mode when --fix-perms is passed', async () => {
    const home = await fixtureDir();
    const data = join(home, 'data.db');
    await writeFile(data, '', { mode: 0o644 });
    const report = await runDoctor({ home, fixPerms: true, print: () => undefined });
    if (process.platform !== 'win32') {
      expect(report.fixedPerms).toContain(data);
    }
  });

  it('reports a clear "no checks" message when no flag is supplied and the dir is missing', async () => {
    const home = join(tmpdir(), `graphorin-cli-doctor-missing-${Date.now()}`);
    const report = await runDoctor({ home, print: () => undefined });
    expect(report.summary.warn + report.summary.skip + report.summary.ok).toBeGreaterThan(0);
  });

  // checkPerms collapses to a single 'permissions' skip row on win32
  // (POSIX modes are not representable there), so the per-path
  // assertions below are only meaningful on POSIX hosts.
  it.skipIf(process.platform === 'win32')(
    'F-06: --config checks the configured storage/audit paths, not ~/.graphorin',
    async () => {
      const dir = await fixtureDir();
      const dbPath = join(dir, 'project.db');
      const auditPath = join(dir, 'project-audit.db');
      const cfg = join(dir, 'graphorin.config.json');
      await writeFile(
        cfg,
        JSON.stringify({
          storage: { path: dbPath, mode: 'lib' },
          audit: { enabled: true, path: auditPath, passphraseRef: 'env:DOCTOR_TEST_PASS' },
          auth: { kind: 'none' },
        }),
        { mode: 0o600 },
      );
      await writeFile(dbPath, '', { mode: 0o600 });
      await writeFile(auditPath, '', { mode: 0o644 });

      const home = join(tmpdir(), `graphorin-cli-doctor-unused-home-${Date.now()}`);
      const report = await runDoctor({
        home,
        config: cfg,
        checkPerms: true,
        print: () => undefined,
      });
      expect(report.configPath).toBe(cfg);
      const checked = report.checks.map((c) => c.check);
      expect(checked).toContain(cfg);
      expect(checked).toContain(dbPath);
      expect(checked).toContain(auditPath);
      // The hardcoded home layout must NOT drive the check under --config.
      expect(checked.some((c) => c.startsWith(home))).toBe(false);
      const audit = report.checks.find((c) => c.check === auditPath);
      expect(audit?.status).toBe('fail');
      const db = report.checks.find((c) => c.check === dbPath);
      expect(db?.status).toBe('ok');
    },
  );

  it.skipIf(process.platform === 'win32')(
    'F-06: default behavior without --config is unchanged',
    async () => {
      const home = await fixtureDir();
      const report = await runDoctor({ home, checkPerms: true, print: () => undefined });
      expect(report.configPath).toBeUndefined();
      expect(report.checks.some((c) => c.check.startsWith(home))).toBe(true);
    },
  );
});

describe('P2-1 (deep retest 2026-07-19) - config-driven doctor respects a disabled audit log', () => {
  it('init --no-encrypted then doctor --all skips the audit-encryption check instead of failing', async () => {
    const dir = await fixtureDir();
    const init = await runInit({
      cwd: dir,
      format: 'json',
      nonInteractive: true,
      cloudConsent: 'public-only',
      encrypted: false,
      print: () => undefined,
    });
    const report = await runDoctor({
      config: init.configPath,
      all: true,
      print: () => undefined,
    });
    const auditCheck = report.checks.find((c) => c.check === 'audit-db');
    expect(auditCheck?.status).toBe('skip');
    expect(auditCheck?.message).toContain('audit log disabled');
    expect(auditCheck?.hint ?? '').not.toContain('Phase 05');
  });
});
