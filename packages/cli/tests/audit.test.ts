import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveSecret } from '@graphorin/security';
import { appendAudit, openAuditDb } from '@graphorin/security/audit';
import { ensureStoreAuditBinding } from '@graphorin/server';
import { describe, expect, it } from 'vitest';

import { runAuditPrune, runAuditVerify } from '../src/commands/audit.js';

async function fixtureWithoutAudit(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-audit-'));
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

describe('graphorin audit verify', () => {
  it('refuses when audit.enabled is false in the resolved config', async () => {
    const cfg = await fixtureWithoutAudit();
    await expect(runAuditVerify({ config: cfg, print: () => undefined })).rejects.toThrow(
      /audit\.enabled/,
    );
  });
});

describe('graphorin audit prune (W-062)', () => {
  it('prints the Merkle re-anchor reminder after a successful prune', async () => {
    process.env.GRAPHORIN_TEST_AUDIT_PASS = 'test-passphrase-1234567890';
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-audit-prune-'));
    const auditPath = join(dir, 'audit.db');
    const cfg = join(dir, 'graphorin.config.json');
    await writeFile(
      cfg,
      JSON.stringify({
        storage: { path: join(dir, 'data.db'), mode: 'lib' },
        auth: { kind: 'none' },
        audit: {
          enabled: true,
          path: auditPath,
          passphraseRef: 'env:GRAPHORIN_TEST_AUDIT_PASS',
        },
      }),
      'utf8',
    );
    // Seed entries directly (same binding the CLI uses).
    ensureStoreAuditBinding();
    const passphrase = await resolveSecret('env:GRAPHORIN_TEST_AUDIT_PASS');
    const db = await openAuditDb({ path: auditPath, passphrase });
    const baseTs = 1_700_000_000_000;
    for (let i = 0; i < 4; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `KEY_${i}`,
        decision: 'success',
        ts: baseTs + i * 1_000,
      });
    }
    await db.close();

    const lines: string[] = [];
    const result = await runAuditPrune({
      config: cfg,
      before: String(baseTs + 2_500),
      retain: 1,
      print: (line) => {
        lines.push(line);
      },
    });
    expect(result.deleted).toBeGreaterThan(0);
    const joined = lines.join('\n');
    expect(joined).toContain('pruned');
    // W-062: the re-anchor reminder rides on every destructive prune.
    expect(joined).toContain('Merkle checkpoints signed before this prune no longer verify');
    expect(joined).toContain('signAuditCheckpoint');
  });

  it('does NOT print the reminder when nothing was pruned', async () => {
    process.env.GRAPHORIN_TEST_AUDIT_PASS = 'test-passphrase-1234567890';
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-audit-noop-'));
    const auditPath = join(dir, 'audit.db');
    const cfg = join(dir, 'graphorin.config.json');
    await writeFile(
      cfg,
      JSON.stringify({
        storage: { path: join(dir, 'data.db'), mode: 'lib' },
        auth: { kind: 'none' },
        audit: {
          enabled: true,
          path: auditPath,
          passphraseRef: 'env:GRAPHORIN_TEST_AUDIT_PASS',
        },
      }),
      'utf8',
    );
    ensureStoreAuditBinding();
    const passphrase = await resolveSecret('env:GRAPHORIN_TEST_AUDIT_PASS');
    const db = await openAuditDb({ path: auditPath, passphrase });
    await appendAudit(db, {
      actor: { kind: 'system', id: 'graphorin' },
      action: 'secret:get',
      target: 'KEY_0',
      decision: 'success',
      ts: 1_700_000_000_000,
    });
    await db.close();

    const lines: string[] = [];
    await runAuditPrune({
      config: cfg,
      before: '1',
      print: (line) => {
        lines.push(line);
      },
    });
    expect(lines.join('\n')).not.toContain('Merkle checkpoints');
  });
});
