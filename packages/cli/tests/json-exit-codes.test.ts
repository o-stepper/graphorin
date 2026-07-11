/**
 * W-002: the exit-code contract holds INDEPENDENTLY of --json. These
 * are exactly the machine consumers (CI) the flag exists for - before
 * the fix, emitReport skipped the human() callback under --json and the
 * process.exitCode assignments inside it evaporated: `graphorin audit
 * verify --json` returned 0 on a broken hash chain.
 */

import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveSecret } from '@graphorin/security';
import { appendAudit, openAuditDb } from '@graphorin/security/audit';
import { ensureStoreAuditBinding } from '@graphorin/server';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { runAuditVerify } from '../src/commands/audit.js';
import { runPricingLookup } from '../src/commands/pricing.js';
import { runSecretsGet } from '../src/commands/secrets.js';
import { runSkillsInspect } from '../src/commands/skills.js';
import { runTokenVerify } from '../src/commands/token.js';
import { runTriggersStatus } from '../src/commands/triggers.js';

const savedExitCode = process.exitCode;
afterEach(() => {
  process.exitCode = savedExitCode;
});

async function fixture(extra: Record<string, unknown> = {}): Promise<{
  cfg: string;
  dir: string;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-json-exit-'));
  const cfg = join(dir, 'graphorin.config.json');
  await writeFile(
    cfg,
    JSON.stringify({
      storage: { path: join(dir, 'data.db'), mode: 'lib' },
      auth: { kind: 'none' },
      ...extra,
    }),
    'utf8',
  );
  return { cfg, dir };
}

describe('W-002 - failures set exit code 1 in --json mode (and emit the payload)', () => {
  it('audit verify --json on a BROKEN chain exits 1', async () => {
    process.env.GRAPHORIN_TEST_AUDIT_PASS = 'test-passphrase-1234567890';
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-json-audit-'));
    const cfg = join(dir, 'graphorin.config.json');
    await writeFile(
      cfg,
      JSON.stringify({
        storage: { path: join(dir, 'data.db'), mode: 'lib' },
        auth: { kind: 'none' },
        audit: {
          enabled: true,
          path: join(dir, 'audit.db'),
          passphraseRef: 'env:GRAPHORIN_TEST_AUDIT_PASS',
        },
      }),
      'utf8',
    );
    ensureStoreAuditBinding();
    const passphrase = await resolveSecret('env:GRAPHORIN_TEST_AUDIT_PASS');
    const db = await openAuditDb({ path: join(dir, 'audit.db'), passphrase });
    await appendAudit(db, {
      actor: { kind: 'system', id: 't' },
      action: 'secret:get',
      target: 'K1',
      decision: 'success',
    });
    const second = await appendAudit(db, {
      actor: { kind: 'system', id: 't' },
      action: 'secret:get',
      target: 'K2',
      decision: 'success',
    });
    // Corrupt the chain: rewrite entry 2 with a bogus hash.
    await db.replaceEntry({ ...second, hash: 'f'.repeat(64) });
    await db.close();

    const payloads: unknown[] = [];
    process.exitCode = 0;
    const out = await runAuditVerify({
      config: cfg,
      json: true,
      jsonPrint: (p) => payloads.push(p),
      print: () => undefined,
    });
    expect(out.ok).toBe(false);
    expect(payloads).toHaveLength(1);
    expect(process.exitCode).toBe(1);
  });

  it('S-14b: audit verify --json with audit DISABLED emits an error document, not silence', async () => {
    const { cfg } = await fixture();
    const payloads: unknown[] = [];
    await expect(
      runAuditVerify({
        config: cfg,
        json: true,
        jsonPrint: (p) => payloads.push(p),
        print: () => undefined,
      }),
    ).rejects.toThrow(/audit\.enabled/);
    expect(payloads).toHaveLength(1);
    const doc = payloads[0] as { ok: boolean; error: string };
    expect(doc.ok).toBe(false);
    // The JSON payload carries the reason WITHOUT the log-line brand.
    expect(doc.error).toContain('audit.enabled = true');
    expect(doc.error).not.toContain('[graphorin/cli]');
  });

  it('pricing lookup --json miss exits 1 with the payload emitted', () => {
    const payloads: unknown[] = [];
    process.exitCode = 0;
    const result = runPricingLookup({
      provider: 'nonexistent-provider',
      model: 'nonexistent-model',
      json: true,
      jsonPrint: (p) => payloads.push(p),
      print: () => undefined,
    });
    expect(result).toBeNull();
    expect(payloads).toHaveLength(1);
    expect(process.exitCode).toBe(1);
  });

  it('pricing lookup --json HIT leaves the exit code untouched', () => {
    process.exitCode = 0;
    const result = runPricingLookup({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      json: true,
      jsonPrint: () => undefined,
      print: () => undefined,
    });
    // Whatever the catalogue holds, a hit must not flip the code; a
    // miss is covered above - only assert when the entry resolves.
    if (result !== null) {
      expect(process.exitCode).toBe(0);
    }
  });

  it('skills inspect --json miss exits 1', async () => {
    const payloads: unknown[] = [];
    process.exitCode = 0;
    const match = await runSkillsInspect({
      name: 'skill-that-does-not-exist',
      json: true,
      jsonPrint: (p) => payloads.push(p),
      print: () => undefined,
    });
    expect(match).toBeNull();
    expect(payloads).toHaveLength(1);
    expect(process.exitCode).toBe(1);
  });

  it('token verify --json on a malformed token exits 1', async () => {
    const payloads: unknown[] = [];
    process.exitCode = 0;
    const out = await runTokenVerify({
      token: 'not-a-real-token',
      json: true,
      jsonPrint: (p) => payloads.push(p),
      print: () => undefined,
    });
    expect(out.ok).toBe(false);
    expect(payloads).toHaveLength(1);
    expect(process.exitCode).toBe(1);
  });

  it('secrets get --json miss exits 1', async () => {
    const payloads: unknown[] = [];
    process.exitCode = 0;
    const out = await runSecretsGet({
      key: 'graphorin_test_definitely_missing_key',
      secretsSource: 'env',
      json: true,
      jsonPrint: (p) => payloads.push(p),
      print: () => undefined,
    });
    expect(out.found).toBe(false);
    expect(payloads).toHaveLength(1);
    expect(process.exitCode).toBe(1);
  });

  it('triggers status --json miss exits 1', async () => {
    const { cfg, dir } = await fixture();
    // triggers status runs with migrationPolicy 'check' (W-068).
    const store = await createSqliteStore({
      path: join(dir, 'data.db'),
      mode: 'lib',
      skipSqliteVec: true,
    });
    await store.init();
    await store.close();
    const payloads: unknown[] = [];
    process.exitCode = 0;
    const state = await runTriggersStatus({
      config: cfg,
      id: 'no-such-trigger',
      json: true,
      jsonPrint: (p) => payloads.push(p),
      print: () => undefined,
    });
    expect(state).toBeNull();
    expect(payloads).toHaveLength(1);
    expect(process.exitCode).toBe(1);
  });
});
