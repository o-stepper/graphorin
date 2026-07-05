/**
 * Phase 03b audit-log DoD-conformance tests.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { appendAudit } from '../../src/audit/append.js';
import { _resetAuditDbBindingsForTesting, openAuditDb } from '../../src/audit/audit-db.js';
import { canonicalJson } from '../../src/audit/canonical-json.js';
import { AuditDbCipherUnavailableError } from '../../src/audit/errors.js';
import { exportAudit } from '../../src/audit/export.js';
import { type PruneAuditLogEvent, pruneAudit } from '../../src/audit/prune.js';
import { bridgeSecretsToAudit } from '../../src/audit/secrets-bridge.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';
import {
  _resetSecretsAuditListenersForTesting,
  emitSecretsAudit,
} from '../../src/secrets/audit-emitter.js';
import { SecretValue } from '../../src/secrets/secret-value.js';

import { createMemoryAuditDb } from './_helpers.js';

describe('Phase 03b - audit-log DoD conformance', () => {
  afterEach(() => {
    _resetAuditDbBindingsForTesting();
    _resetSecretsAuditListenersForTesting();
  });

  describe('1000-entry chain integrity', () => {
    it('verifyAuditChain returns ok over 1000 appended entries', async () => {
      const db = createMemoryAuditDb();
      for (let i = 0; i < 1000; i += 1) {
        await appendAudit(db, {
          actor: { kind: 'system', id: 'graphorin' },
          action: 'secret:get',
          target: `KEY_${i}`,
          decision: 'success',
          ts: 1_700_000_000_000 + i,
        });
      }
      const result = await verifyAuditChain(db);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.count).toBe(1000);
    });

    it('a single-row tamper at seq N → verifyAuditChain returns brokenAt=N', async () => {
      const db = createMemoryAuditDb();
      for (let i = 0; i < 50; i += 1) {
        await appendAudit(db, {
          actor: { kind: 'system', id: 'graphorin' },
          action: 'secret:get',
          target: `KEY_${i}`,
          decision: 'success',
          ts: 1_700_000_000_000 + i,
        });
      }
      type Stored = Awaited<ReturnType<typeof db.latest>>;
      const rows: NonNullable<Stored>[] = [];
      for await (const row of db.iterate()) rows.push(row);
      const target = rows[27];
      if (target === undefined) throw new Error('missing fixture row');
      await db.replaceEntry({ ...target, target: 'TAMPERED' });
      const result = await verifyAuditChain(db);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.brokenAt).toBe(target.seq);
        expect(result.expected).not.toBe(result.actual);
      }
    });
  });

  describe('audit.db open path', () => {
    it('throws AuditDbCipherUnavailableError when no binding is registered', async () => {
      await expect(
        openAuditDb({
          path: '/tmp/audit.db',
          passphrase: SecretValue.fromString('p'),
        }),
      ).rejects.toBeInstanceOf(AuditDbCipherUnavailableError);
    });

    it('the error carries an actionable verbatim install command', async () => {
      try {
        await openAuditDb({
          path: '/tmp/audit.db',
          passphrase: SecretValue.fromString('p'),
        });
        throw new Error('expected throw');
      } catch (err) {
        if (!(err instanceof AuditDbCipherUnavailableError)) throw err;
        expect(err.installCommand).toBe(
          'pnpm add @graphorin/store-sqlite better-sqlite3-multiple-ciphers',
        );
        expect(err.hint).toContain('pnpm add');
      }
    });
  });

  describe('pruneAudit', () => {
    it('retains the documented minimum survivor count', async () => {
      const db = createMemoryAuditDb();
      for (let i = 0; i < 10; i += 1) {
        await appendAudit(db, {
          actor: { kind: 'system', id: 'graphorin' },
          action: 'secret:get',
          target: `KEY_${i}`,
          decision: 'success',
          ts: 1_700_000_000_000 + i * 1_000,
        });
      }
      await pruneAudit(db, {
        before: 1_700_000_000_000 + 100_000, // older than every entry
        retain: 4,
      });
      // The `retain` floor must keep at least 4 surviving rows.
      expect(await db.count()).toBeGreaterThanOrEqual(4);
    });

    it('emits exactly one INFO log event per prune run', async () => {
      const db = createMemoryAuditDb();
      for (let i = 0; i < 5; i += 1) {
        await appendAudit(db, {
          actor: { kind: 'system', id: 'graphorin' },
          action: 'secret:get',
          target: `KEY_${i}`,
          decision: 'success',
          ts: 1_700_000_000_000 + i * 1_000,
        });
      }
      const events: PruneAuditLogEvent[] = [];
      await pruneAudit(db, {
        before: 1_700_000_000_000 + 2_500,
        retain: 1,
        logger: (e) => events.push(e),
      });
      expect(events.length).toBe(1);
      expect(events[0]?.level).toBe('info');
      expect(events[0]?.message).toContain('pruneAudit');
      expect(events[0]?.deleted).toBeGreaterThan(0);
    });
  });

  describe('exportAudit deterministic JSONL', () => {
    it('byte-for-byte reproducible output for the same fixture', async () => {
      const dbA = createMemoryAuditDb();
      const dbB = createMemoryAuditDb();
      for (let i = 0; i < 5; i += 1) {
        const entry = {
          actor: { kind: 'system' as const, id: 'graphorin' },
          action: 'secret:get' as const,
          target: `KEY_${i}`,
          decision: 'success' as const,
          ts: 1_700_000_000_000 + i,
          metadata: { i, label: 'fixture' },
        };
        await appendAudit(dbA, entry);
        await appendAudit(dbB, entry);
      }
      const linesA: string[] = [];
      const linesB: string[] = [];
      await exportAudit(dbA, { writer: { write: (l) => void linesA.push(l) } });
      await exportAudit(dbB, { writer: { write: (l) => void linesB.push(l) } });
      expect(linesA).toEqual(linesB);
    });

    it('every emitted line is valid canonical JSON terminated by `\\n`', async () => {
      const db = createMemoryAuditDb();
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'audit:db-opened',
        target: 'audit.db',
        decision: 'success',
        ts: 1_700_000_000_000,
      });
      const lines: string[] = [];
      await exportAudit(db, { writer: { write: (l) => void lines.push(l) } });
      expect(lines.length).toBe(1);
      const line = lines[0] ?? '';
      expect(line.endsWith('\n')).toBe(true);
      const parsed = JSON.parse(line.trim()) as Record<string, unknown>;
      // Round-trip through canonicalJson must yield the same string
      // (modulo the trailing newline) - that is the determinism contract.
      expect(`${canonicalJson(parsed)}\n`).toBe(line);
    });
  });

  describe('secrets → audit bridge', () => {
    it('translates a fixture event into a chain entry', async () => {
      const db = createMemoryAuditDb();
      bridgeSecretsToAudit({ db });
      emitSecretsAudit({
        action: 'secret:get',
        decision: 'success',
        ts: 1_700_000_000_000,
        source: 'KeyringSecretsStore',
        target: 'OPENAI_API_KEY',
        actor: { kind: 'tool', toolName: 'http.fetch' },
      });
      // The bridge writes asynchronously; flush via setImmediate.
      await new Promise((resolve) => setImmediate(resolve));
      expect(await db.count()).toBe(1);
      const verify = await verifyAuditChain(db);
      expect(verify.ok).toBe(true);
    });
  });

  describe('Performance: audit append throughput', () => {
    it('appends ≥ 1000 entries / sec on the in-memory binding', async () => {
      const db = createMemoryAuditDb();
      const N = 1000;
      const start = performance.now();
      for (let i = 0; i < N; i += 1) {
        await appendAudit(db, {
          actor: { kind: 'system', id: 'graphorin' },
          action: 'secret:get',
          target: `KEY_${i}`,
          decision: 'success',
          ts: 1_700_000_000_000 + i,
        });
      }
      const elapsedMs = performance.now() - start;
      const throughput = N / (elapsedMs / 1000);
      // Generous floor so the test stays stable on slow CI runners
      // while still proving the append path is not pathologically slow.
      expect(throughput).toBeGreaterThan(1000);
    });
  });
});
