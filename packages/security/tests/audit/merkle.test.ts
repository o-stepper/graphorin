/**
 * D4 Merkle transparency layer over the audit log: inclusion proofs,
 * consistency proofs, Ed25519-signed checkpoints, and anchored
 * tamper-resistance (a rewrite of a checkpointed prefix fails the
 * consistency check against the surviving signed head).
 */

import { describe, expect, it } from 'vitest';
import { appendAudit } from '../../src/audit/append.js';
import {
  computeAuditTreeHead,
  generateAuditSigningKeyPair,
  proveAuditConsistency,
  proveAuditInclusion,
  signAuditCheckpoint,
  verifyAuditAgainstCheckpoint,
  verifyAuditCheckpointSignature,
  verifyAuditConsistency,
  verifyAuditInclusion,
} from '../../src/audit/merkle.js';
import type { StoredAuditEntry } from '../../src/audit/types.js';
import { createMemoryAuditDb } from './_helpers.js';

async function seed(count: number): Promise<ReturnType<typeof createMemoryAuditDb>> {
  const db = createMemoryAuditDb();
  for (let i = 0; i < count; i += 1) {
    await appendAudit(db, {
      actor: { kind: 'system', id: 'graphorin' },
      action: 'secret:get',
      target: `KEY_${i}`,
      decision: 'success',
      ts: 1_700_000_000_000 + i,
    });
  }
  return db;
}

async function entriesOf(db: ReturnType<typeof createMemoryAuditDb>): Promise<StoredAuditEntry[]> {
  const out: StoredAuditEntry[] = [];
  for await (const e of db.iterate()) out.push(e);
  return out;
}

describe('audit Merkle — inclusion proofs', () => {
  it('proves and verifies inclusion for every entry across sizes', async () => {
    for (const n of [1, 2, 3, 5, 8, 13]) {
      const db = await seed(n);
      const head = await computeAuditTreeHead(db);
      const entries = await entriesOf(db);
      for (const entry of entries) {
        const proof = await proveAuditInclusion(db, entry.seq, head);
        expect(verifyAuditInclusion(entry, proof, head)).toBe(true);
      }
      await db.close();
    }
  });

  it('rejects an inclusion proof for a tampered entry', async () => {
    const db = await seed(6);
    const head = await computeAuditTreeHead(db);
    const [first, ...rest] = await entriesOf(db);
    const proof = await proveAuditInclusion(db, first?.seq ?? 1, head);
    const tampered = { ...(first as StoredAuditEntry), target: 'ROTATED' };
    expect(verifyAuditInclusion(tampered, proof, head)).toBe(false);
    // A different real entry against the first entry's proof also fails.
    expect(verifyAuditInclusion(rest[0] as StoredAuditEntry, proof, head)).toBe(false);
    await db.close();
  });
});

describe('audit Merkle — consistency proofs', () => {
  it('proves append-only extension between two heads', async () => {
    const db = await seed(4);
    const older = await computeAuditTreeHead(db);
    for (let i = 0; i < 5; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `MORE_${i}`,
        decision: 'success',
        ts: 1_700_000_100_000 + i,
      });
    }
    const newer = await computeAuditTreeHead(db);
    const proof = await proveAuditConsistency(db, older, newer);
    expect(verifyAuditConsistency(older, newer, proof)).toBe(true);
    await db.close();
  });

  it('a rewrite of the covered prefix fails the consistency check', async () => {
    const db = await seed(4);
    const older = await computeAuditTreeHead(db);
    // Append more, then REWRITE an entry inside the older prefix.
    for (let i = 0; i < 3; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `MORE_${i}`,
        decision: 'success',
        ts: 1_700_000_200_000 + i,
      });
    }
    const entries = await entriesOf(db);
    const victim = entries[1] as StoredAuditEntry;
    await db.replaceEntry({ ...victim, target: 'FORGED' });
    const newer = await computeAuditTreeHead(db);
    // The honest proof-generation now runs over the forged log; the
    // proof cannot reconcile the original `older` root with the forged
    // `newer` root.
    const proof = await proveAuditConsistency(db, older, newer);
    expect(verifyAuditConsistency(older, newer, proof)).toBe(false);
    await db.close();
  });
});

describe('audit Merkle — signed checkpoints (anchoring)', () => {
  it('signs a tree head and verifies against the pinned key', async () => {
    const db = await seed(5);
    const { publicKeyPem, privateKeyPem } = generateAuditSigningKeyPair();
    const checkpoint = await signAuditCheckpoint(db, {
      privateKeyPem,
      writerId: 'ci-runner',
      now: () => 1_700_000_500_000,
    });
    expect(checkpoint.head.size).toBe(5);
    expect(verifyAuditCheckpointSignature(checkpoint, publicKeyPem)).toBe(true);

    // A tampered head fails signature verification.
    const forged = { ...checkpoint, head: { ...checkpoint.head, rootHash: 'deadbeef' } };
    expect(verifyAuditCheckpointSignature(forged, publicKeyPem)).toBe(false);

    // A different key fails.
    const other = generateAuditSigningKeyPair();
    expect(verifyAuditCheckpointSignature(checkpoint, other.publicKeyPem)).toBe(false);
    await db.close();
  });

  it('anchored verification detects a post-checkpoint rewrite', async () => {
    const db = await seed(4);
    const { publicKeyPem, privateKeyPem } = generateAuditSigningKeyPair();
    const checkpoint = await signAuditCheckpoint(db, {
      privateKeyPem,
      writerId: 'ci-runner',
      now: () => 1_700_000_600_000,
    });
    // Honest growth verifies OK against the checkpoint.
    for (let i = 0; i < 3; i += 1) {
      await appendAudit(db, {
        actor: { kind: 'system', id: 'graphorin' },
        action: 'secret:get',
        target: `GROW_${i}`,
        decision: 'success',
        ts: 1_700_000_700_000 + i,
      });
    }
    const ok = await verifyAuditAgainstCheckpoint(db, checkpoint, { publicKeyPem });
    expect(ok.ok).toBe(true);

    // Now rewrite a checkpointed entry — anchored verification fails.
    const entries = await entriesOf(db);
    await db.replaceEntry({ ...(entries[0] as StoredAuditEntry), target: 'FORGED' });
    const bad = await verifyAuditAgainstCheckpoint(db, checkpoint, { publicKeyPem });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toBe('inconsistent-log');
    await db.close();
  });
});
