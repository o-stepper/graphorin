import { describe, expect, it } from 'vitest';

import { appendAudit } from '../../src/audit/append.js';
import { exportAudit } from '../../src/audit/export.js';
import {
  generateAuditSigningKeyPair,
  signAuditCheckpoint,
  verifyAuditAgainstCheckpoint,
} from '../../src/audit/merkle.js';
import { pruneAudit } from '../../src/audit/prune.js';
import { verifyAuditChain } from '../../src/audit/verify-chain.js';

import { createMemoryAuditDb } from './_helpers.js';

describe('@graphorin/security/audit - prune + export', () => {
  it('pruneAudit drops old entries and rewrites the surviving prevHash', async () => {
    const db = createMemoryAuditDb();
    const baseTs = 1_700_000_000_000;
    for (let i = 0; i < 10; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `KEY_${i}`,
        decision: 'success',
        ts: baseTs + i * 1_000,
      });
    }
    const result = await pruneAudit(db, {
      before: baseTs + 5_000,
      retain: 1,
    });
    expect(result.deleted).toBeGreaterThan(0);
    expect(result.firstSurvivingSeq).toBeDefined();
    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true);
  });

  it('pruneAudit refuses to leave fewer than `retain` rows', async () => {
    const db = createMemoryAuditDb();
    for (let i = 0; i < 5; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `KEY_${i}`,
        decision: 'success',
        ts: 1_700_000_000_000 + i,
      });
    }
    const result = await pruneAudit(db, {
      before: 1_700_000_000_000 + 100, // retain everything anyway
      retain: 5,
    });
    expect(result.deleted).toBe(0);
  });

  it('retains an expired entry that sits (by seq) behind a not-yet-expired one (SPL-21)', async () => {
    const db = createMemoryAuditDb();
    const cutoff = 1_700_000_000_000;
    // seq 1 expired · seq 2 in the FUTURE (out-of-order ts) · seq 3 expired.
    // Only the leading contiguous expired prefix [seq 1] may be removed - seq 3
    // is expired but cannot be deleted without punching a hole behind seq 2,
    // which must survive. Deleting fewer than the wall-clock cutoff implies is
    // the safe, chain-preserving behaviour.
    for (const [target, ts] of [
      ['A', cutoff - 10_000],
      ['B', cutoff + 10_000],
      ['C', cutoff - 5_000],
    ] as const) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target,
        decision: 'success',
        ts,
      });
    }
    const result = await pruneAudit(db, { before: cutoff, retain: 1 });
    expect(result.deleted).toBe(1);
    expect(result.firstSurvivingSeq).toBe(2);
    const verify = await verifyAuditChain(db);
    expect(verify.ok).toBe(true);
  });

  it('pruneAudit on empty chain reports zero deletions', async () => {
    const db = createMemoryAuditDb();
    const result = await pruneAudit(db, { before: Date.now() });
    expect(result.deleted).toBe(0);
  });

  it('pruneAudit rejects a non-finite before', async () => {
    const db = createMemoryAuditDb();
    await expect(pruneAudit(db, { before: Number.NaN })).rejects.toBeInstanceOf(RangeError);
  });

  it('exportAudit writes a JSONL line per entry', async () => {
    const db = createMemoryAuditDb();
    for (let i = 0; i < 3; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `KEY_${i}`,
        decision: 'success',
        ts: 1_700_000_000_000 + i,
      });
    }
    const lines: string[] = [];
    const result = await exportAudit(db, {
      writer: { write: (l) => void lines.push(l) },
    });
    expect(result.rows).toBe(3);
    expect(lines.length).toBe(3);
    for (const line of lines) {
      expect(line.endsWith('\n')).toBe(true);
      const parsed = JSON.parse(line.trim()) as Record<string, unknown>;
      expect(parsed.action).toBe('secret:get');
    }
  });

  it('exportAudit honours include predicate', async () => {
    const db = createMemoryAuditDb();
    await appendAudit(db, {
      actor: { kind: 'system', id: 'graphorin' },
      action: 'secret:get',
      target: 'A',
      decision: 'success',
      ts: 1,
    });
    await appendAudit(db, {
      actor: { kind: 'system', id: 'graphorin' },
      action: 'secret:set',
      target: 'B',
      decision: 'success',
      ts: 2,
    });
    const lines: string[] = [];
    const result = await exportAudit(db, {
      writer: { write: (l) => void lines.push(l) },
      include: (e) => e.action === 'secret:get',
    });
    expect(result.rows).toBe(1);
    expect(lines[0]).toMatch(/"action":"secret:get"/);
  });

  it('exportAudit honours fromSeq/toSeq bounds', async () => {
    const db = createMemoryAuditDb();
    for (let i = 0; i < 5; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `KEY_${i}`,
        decision: 'success',
        ts: 1_700_000_000_000 + i,
      });
    }
    const lines: string[] = [];
    const result = await exportAudit(db, {
      fromSeq: 2,
      toSeq: 4,
      writer: { write: (l) => void lines.push(l) },
    });
    expect(result.rows).toBe(3);
  });
});

describe('W-062: prune vs Merkle anchoring - executable contract', () => {
  it('verifyAuditAgainstCheckpoint against a pre-prune checkpoint MUST fail after pruneAudit', async () => {
    const db = createMemoryAuditDb();
    const baseTs = 1_700_000_000_000;
    for (let i = 0; i < 8; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `KEY_${i}`,
        decision: 'success',
        ts: baseTs + i * 1_000,
      });
    }
    const { publicKeyPem, privateKeyPem } = generateAuditSigningKeyPair();
    const preCheckpoint = await signAuditCheckpoint(db, { privateKeyPem, writerId: 'test' });
    // Sanity: the anchor verifies before the prune.
    const before = await verifyAuditAgainstCheckpoint(db, preCheckpoint, { publicKeyPem });
    expect(before.ok).toBe(true);

    const pruned = await pruneAudit(db, { before: baseTs + 4_500, retain: 1 });
    expect(pruned.deleted).toBeGreaterThan(0);

    // The re-root recomputed every surviving hash: a legitimate
    // retention prune is BY DESIGN indistinguishable from a
    // truncate-and-re-root attack against the old anchor - the
    // operator runbook (sign + distribute a fresh checkpoint) is the
    // only thing that tells them apart.
    const after = await verifyAuditAgainstCheckpoint(db, preCheckpoint, { publicKeyPem });
    expect(after.ok).toBe(false);

    // A FRESH post-prune checkpoint anchors the new head.
    const postCheckpoint = await signAuditCheckpoint(db, { privateKeyPem, writerId: 'test' });
    const fresh = await verifyAuditAgainstCheckpoint(db, postCheckpoint, { publicKeyPem });
    expect(fresh.ok).toBe(true);
  });
});
