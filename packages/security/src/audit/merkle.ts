/**
 * RFC-6962 Merkle layer over the audit log (D4). The write path stays
 * the O(1) linear hash chain (`appendAudit`); this module adds the
 * transparency-log machinery the chain alone cannot provide:
 *
 * - a **Merkle tree head** over the stored entries (leaf = the entry's
 *   canonical JSON, hashed with the RFC-6962 `0x00` leaf prefix),
 * - **inclusion proofs** ("entry N is in the log with head H"),
 * - **consistency proofs** ("head H2 is an append-only extension of
 *   H1" - the anti-truncation / anti-rewrite check `pruneAudit`-style
 *   re-rooting cannot forge),
 * - **Ed25519-signed checkpoints** (signed tree heads) so an operator
 *   can anchor the log externally: persist a signed head out-of-band
 *   and any later tamper (rewrite, reorder, truncate-and-re-root) is
 *   detected by a failed consistency proof against it.
 *
 * This upgrades the audit trail from tamper-EVIDENT (the chain) to
 * tamper-RESISTANT against writers who can rewrite the local database,
 * as long as one signed checkpoint survives outside their reach.
 *
 * @packageDocumentation
 */

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
  generateKeyPairSync,
} from 'node:crypto';
import type { AuditDb } from './audit-db.js';
import { canonicalJson } from './canonical-json.js';
import type { StoredAuditEntry } from './types.js';

/** RFC 6962 domain-separation prefixes. */
const LEAF_PREFIX = Buffer.from([0x00]);
const NODE_PREFIX = Buffer.from([0x01]);

function sha256(...parts: ReadonlyArray<Buffer>): Buffer {
  const h = createHash('sha256');
  for (const part of parts) h.update(part);
  return h.digest();
}

/** RFC 6962 leaf hash: `SHA-256(0x00 || leaf-bytes)`. */
export function leafHash(entry: StoredAuditEntry): Buffer {
  return sha256(LEAF_PREFIX, Buffer.from(canonicalJson(entry), 'utf8'));
}

/** RFC 6962 interior-node hash: `SHA-256(0x01 || left || right)`. */
function nodeHash(left: Buffer, right: Buffer): Buffer {
  return sha256(NODE_PREFIX, left, right);
}

/**
 * RFC 6962 §2.1 Merkle Tree Hash over ordered leaf hashes. The empty
 * tree hashes to `SHA-256()` per the RFC.
 */
export function merkleTreeHash(leaves: ReadonlyArray<Buffer>): Buffer {
  if (leaves.length === 0) return createHash('sha256').digest();
  if (leaves.length === 1) return leaves[0] as Buffer;
  const k = largestPowerOfTwoBelow(leaves.length);
  return nodeHash(merkleTreeHash(leaves.slice(0, k)), merkleTreeHash(leaves.slice(k)));
}

/** Largest power of two strictly less than `n` (n >= 2). */
function largestPowerOfTwoBelow(n: number): number {
  let k = 1;
  while (k * 2 < n) k *= 2;
  return k;
}

/** RFC 6962 §2.1.1 inclusion-proof path for leaf `m` of `n`. */
function inclusionPath(m: number, leaves: ReadonlyArray<Buffer>): Buffer[] {
  const n = leaves.length;
  if (n <= 1) return [];
  const k = largestPowerOfTwoBelow(n);
  if (m < k) {
    return [...inclusionPath(m, leaves.slice(0, k)), merkleTreeHash(leaves.slice(k))];
  }
  return [...inclusionPath(m - k, leaves.slice(k)), merkleTreeHash(leaves.slice(0, k))];
}

/** RFC 6962 §2.1.2 SUBPROOF(m, D[n], b) - consistency path from size `m` to `n`. */
function consistencyPath(
  m: number,
  leaves: ReadonlyArray<Buffer>,
  isCompleteSubtree = true,
): Buffer[] {
  const n = leaves.length;
  if (m === n) {
    return isCompleteSubtree ? [] : [merkleTreeHash(leaves)];
  }
  const k = largestPowerOfTwoBelow(n);
  if (m <= k) {
    return [
      ...consistencyPath(m, leaves.slice(0, k), isCompleteSubtree),
      merkleTreeHash(leaves.slice(k)),
    ];
  }
  return [...consistencyPath(m - k, leaves.slice(k), false), merkleTreeHash(leaves.slice(0, k))];
}

/**
 * Tree head of the audit log at a given size: the anchor unit for
 * checkpointing and proofs.
 *
 * @stable
 */
export interface AuditTreeHead {
  /** Number of leaves (audit entries) covered. */
  readonly size: number;
  /** Hex Merkle root (`SHA-256`, RFC 6962). */
  readonly rootHash: string;
  /** `seq` of the newest covered entry (`0` for the empty log). */
  readonly lastSeq: number;
}

/** Load leaf hashes in `seq` order (the append order = leaf order). */
async function loadLeaves(
  db: AuditDb,
  bounds?: { readonly toSeq?: number },
): Promise<{ leaves: Buffer[]; lastSeq: number }> {
  const leaves: Buffer[] = [];
  let lastSeq = 0;
  for await (const entry of db.iterate(
    bounds?.toSeq !== undefined ? { toSeq: bounds.toSeq } : undefined,
  )) {
    leaves.push(leafHash(entry));
    lastSeq = entry.seq;
  }
  return { leaves, lastSeq };
}

/**
 * Compute the current (or historical, via `toSeq`) Merkle tree head of
 * the audit log.
 *
 * @stable
 */
export async function computeAuditTreeHead(
  db: AuditDb,
  opts: { readonly toSeq?: number } = {},
): Promise<AuditTreeHead> {
  const { leaves, lastSeq } = await loadLeaves(db, opts);
  return {
    size: leaves.length,
    rootHash: merkleTreeHash(leaves).toString('hex'),
    lastSeq,
  };
}

/**
 * Inclusion proof that the entry at `seq` is covered by `head`.
 *
 * @stable
 */
export interface AuditInclusionProof {
  readonly seq: number;
  /** 0-based leaf index within the tree of `treeSize` leaves. */
  readonly leafIndex: number;
  readonly treeSize: number;
  /** Bottom-up audit path, hex node hashes. */
  readonly path: ReadonlyArray<string>;
}

/**
 * Produce an RFC-6962 inclusion proof for the entry at `seq` against
 * the head of size `head.size`. Throws when the entry is not covered.
 *
 * @stable
 */
export async function proveAuditInclusion(
  db: AuditDb,
  seq: number,
  head: AuditTreeHead,
): Promise<AuditInclusionProof> {
  const { leaves } = await loadLeaves(db, { toSeq: head.lastSeq });
  if (leaves.length !== head.size) {
    throw new Error(
      `[graphorin/security] audit log size ${leaves.length} does not match head size ${head.size} - the log changed since the head was computed`,
    );
  }
  let leafIndex = -1;
  let cursor = 0;
  for await (const entry of db.iterate({ toSeq: head.lastSeq })) {
    if (entry.seq === seq) {
      leafIndex = cursor;
      break;
    }
    cursor += 1;
  }
  if (leafIndex < 0) {
    throw new Error(`[graphorin/security] audit entry seq=${seq} is not covered by this head`);
  }
  return {
    seq,
    leafIndex,
    treeSize: head.size,
    path: inclusionPath(leafIndex, leaves).map((b) => b.toString('hex')),
  };
}

/**
 * Verify an inclusion proof (RFC 6962 §2.1.1 verification algorithm) -
 * pure; needs only the entry, the proof, and the trusted head.
 *
 * @stable
 */
export function verifyAuditInclusion(
  entry: StoredAuditEntry,
  proof: AuditInclusionProof,
  head: AuditTreeHead,
): boolean {
  if (proof.treeSize !== head.size) return false;
  if (proof.leafIndex < 0 || proof.leafIndex >= proof.treeSize) return false;
  // RFC 9162 §2.1.3.2 verification: fold the audit path into the leaf
  // hash, choosing sibling side by the parity of the running index and
  // collapsing the index each time the node spans to the right edge.
  let hash = leafHash(entry);
  let fn = proof.leafIndex;
  let sn = proof.treeSize - 1;
  for (const nodeHex of proof.path) {
    const sibling = Buffer.from(nodeHex, 'hex');
    if (sn === 0) return false;
    if ((fn & 1) === 1 || fn === sn) {
      hash = nodeHash(sibling, hash);
      if ((fn & 1) === 0) {
        while (fn !== 0 && (fn & 1) === 0) {
          fn >>= 1;
          sn >>= 1;
        }
      }
    } else {
      hash = nodeHash(hash, sibling);
    }
    fn >>= 1;
    sn >>= 1;
  }
  return sn === 0 && hash.toString('hex') === head.rootHash;
}

/**
 * Produce an RFC-6962 consistency proof that the log at `older.size`
 * is a prefix of the log at `newer.size`.
 *
 * @stable
 */
export async function proveAuditConsistency(
  db: AuditDb,
  older: AuditTreeHead,
  newer: AuditTreeHead,
): Promise<ReadonlyArray<string>> {
  if (older.size > newer.size) {
    throw new Error(
      '[graphorin/security] consistency proofs go from the SMALLER head to the larger',
    );
  }
  const { leaves } = await loadLeaves(db, { toSeq: newer.lastSeq });
  if (leaves.length !== newer.size) {
    throw new Error(
      `[graphorin/security] audit log size ${leaves.length} does not match head size ${newer.size}`,
    );
  }
  if (older.size === 0 || older.size === newer.size) return [];
  return consistencyPath(older.size, leaves).map((b) => b.toString('hex'));
}

/**
 * Verify a consistency proof between two heads (RFC 6962 §2.1.2). A
 * `true` result means `newer` is an append-only extension of `older` -
 * nothing covered by `older` was rewritten, reordered, or truncated.
 *
 * @stable
 */
export function verifyAuditConsistency(
  older: AuditTreeHead,
  newer: AuditTreeHead,
  proof: ReadonlyArray<string>,
): boolean {
  if (older.size > newer.size) return false;
  if (older.size === 0) return true;
  if (older.size === newer.size) {
    return older.rootHash === newer.rootHash && proof.length === 0;
  }
  // RFC 9162 §2.1.4.2 verification algorithm. When the older size is a
  // power of two its root is a node of the newer tree and is not
  // repeated in the proof - prepend it as the seed.
  const path = proof.map((hex) => Buffer.from(hex, 'hex'));
  const full = isPowerOfTwo(older.size) ? [Buffer.from(older.rootHash, 'hex'), ...path] : path;
  const seed = full[0];
  if (seed === undefined) return false;
  let fn = older.size - 1;
  let sn = newer.size - 1;
  // Right-shift both while fn is odd, so fr/sr start at a left-branch node.
  while ((fn & 1) === 1) {
    fn >>= 1;
    sn >>= 1;
  }
  let fr: Buffer = seed;
  let sr: Buffer = seed;
  for (let idx = 1; idx < full.length; idx++) {
    const c = full[idx] as Buffer;
    if (sn === 0) return false;
    if ((fn & 1) === 1 || fn === sn) {
      fr = nodeHash(c, fr);
      sr = nodeHash(c, sr);
      if ((fn & 1) === 0) {
        while (fn !== 0 && (fn & 1) === 0) {
          fn >>= 1;
          sn >>= 1;
        }
      }
    } else {
      sr = nodeHash(sr, c);
    }
    fn >>= 1;
    sn >>= 1;
  }
  return fr.toString('hex') === older.rootHash && sr.toString('hex') === newer.rootHash && sn === 0;
}

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Ed25519-signed audit checkpoint (a signed tree head). Persist it
 * anywhere outside the writer's reach (a different host, an object
 * store, a ticket) - any later rewrite of the covered prefix fails the
 * consistency proof against it.
 *
 * @stable
 */
export interface SignedAuditCheckpoint {
  readonly head: AuditTreeHead;
  /** Stable id of the signing writer (operator / CI / host). */
  readonly writerId: string;
  /** ISO-8601 signing time. */
  readonly signedAt: string;
  /** base64url Ed25519 signature over the canonical checkpoint body. */
  readonly signature: string;
  /** PEM (SPKI) public key - carried for convenience; pin it separately. */
  readonly publicKeyPem: string;
}

function checkpointBytes(head: AuditTreeHead, writerId: string, signedAt: string): Buffer {
  return Buffer.from(
    canonicalJson({ head, writerId, signedAt, v: 'graphorin-audit-checkpoint/1' }),
    'utf8',
  );
}

/**
 * Generate an Ed25519 keypair for audit-checkpoint signing (PEM SPKI /
 * PKCS8). Convenience for operators without existing key material.
 *
 * @stable
 */
export function generateAuditSigningKeyPair(): {
  readonly publicKeyPem: string;
  readonly privateKeyPem: string;
} {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
}

/**
 * Compute and sign the current tree head.
 *
 * @stable
 */
export async function signAuditCheckpoint(
  db: AuditDb,
  opts: {
    readonly privateKeyPem: string;
    readonly writerId: string;
    /** Override the wall clock - used by tests. */
    readonly now?: () => number;
  },
): Promise<SignedAuditCheckpoint> {
  const head = await computeAuditTreeHead(db);
  const signedAt = new Date((opts.now ?? Date.now)()).toISOString();
  const privateKey = createPrivateKey(opts.privateKeyPem);
  const publicKeyPem = createPublicKey(privateKey)
    .export({ type: 'spki', format: 'pem' })
    .toString();
  const signature = cryptoSign(null, checkpointBytes(head, opts.writerId, signedAt), privateKey);
  return {
    head,
    writerId: opts.writerId,
    signedAt,
    signature: signature.toString('base64url'),
    publicKeyPem,
  };
}

/**
 * Verify a signed checkpoint's Ed25519 signature against a pinned
 * public key (pure - no database access).
 *
 * @stable
 */
export function verifyAuditCheckpointSignature(
  checkpoint: SignedAuditCheckpoint,
  publicKeyPem: string,
): boolean {
  try {
    return cryptoVerify(
      null,
      checkpointBytes(checkpoint.head, checkpoint.writerId, checkpoint.signedAt),
      createPublicKey(publicKeyPem),
      Buffer.from(checkpoint.signature, 'base64url'),
    );
  } catch {
    return false;
  }
}

/**
 * Full anchored verification: the checkpoint's signature is valid
 * against the pinned key AND the current log is an append-only
 * extension of the checkpointed head (consistency proof computed and
 * verified over the live database).
 *
 * @stable
 */
export async function verifyAuditAgainstCheckpoint(
  db: AuditDb,
  checkpoint: SignedAuditCheckpoint,
  opts: { readonly publicKeyPem: string },
): Promise<
  | { readonly ok: true; readonly current: AuditTreeHead }
  | {
      readonly ok: false;
      readonly reason: 'bad-signature' | 'inconsistent-log';
      readonly current?: AuditTreeHead;
    }
> {
  if (!verifyAuditCheckpointSignature(checkpoint, opts.publicKeyPem)) {
    return { ok: false, reason: 'bad-signature' };
  }
  const current = await computeAuditTreeHead(db);
  if (current.size < checkpoint.head.size) {
    return { ok: false, reason: 'inconsistent-log', current };
  }
  const proof = await proveAuditConsistency(db, checkpoint.head, current);
  return verifyAuditConsistency(checkpoint.head, current, proof)
    ? { ok: true, current }
    : { ok: false, reason: 'inconsistent-log', current };
}
