/**
 * Channel access policy: WHO may talk to the gateway. Evaluated on
 * every inbound message BEFORE sanitization, routing and any agent
 * involvement, so unauthorized peers never consume model tokens.
 *
 * Four deterministic policies:
 *
 *  - `'pairing'` (default) - unknown peers get a short-lived one-time
 *    code; the operator approves it out-of-band (CLI / REST); the
 *    peer becomes durably paired (persisted via the `PairingStore`
 *    contract from `@graphorin/core/contracts`).
 *  - `'allowlist'` - only explicitly listed peers pass.
 *  - `'open'` - everyone passes (trusted deployments only).
 *  - `'disabled'` - nobody passes (kill switch).
 *
 * The controller owns the expiry POLICY (TTL, pending cap) and
 * injects its clock into the store, so behavior is deterministic
 * under test.
 *
 * @packageDocumentation
 */

import { randomInt } from 'node:crypto';
import type { PairedPeerRecord, PairingPeerRef, PairingStore } from '@graphorin/core/contracts';
import type { ChannelIdentity } from './spi.js';

/** The four access policy kinds. @stable */
export type ChannelAccessPolicyKind = 'pairing' | 'allowlist' | 'open' | 'disabled';

/**
 * One allowlist entry. `accountId` is optional (matches any account
 * of the channel when omitted); `channelId` and `peerId` are exact.
 *
 * @stable
 */
export interface ChannelAllowlistEntry {
  readonly channelId: string;
  readonly accountId?: string;
  readonly peerId: string;
}

/** Tuning for the `'pairing'` policy. @stable */
export interface PairingPolicyOptions {
  /** Pairing-code lifetime. Default 1 hour. */
  readonly ttlMs?: number;
  /** Cap on simultaneously pending codes per channel. Default 3. */
  readonly maxPendingPerChannel?: number;
  /** Code length. Default 8. */
  readonly codeLength?: number;
}

/**
 * Access policy configuration. Data, not code: the application
 * supplies the kind plus its parameters.
 *
 * @stable
 */
export interface ChannelAccessPolicyConfig {
  readonly kind: ChannelAccessPolicyKind;
  /** Required when `kind` is `'allowlist'`. */
  readonly allowlist?: ReadonlyArray<ChannelAllowlistEntry>;
  /** Tuning for `kind: 'pairing'`. */
  readonly pairing?: PairingPolicyOptions;
}

/**
 * Outcome of an access check.
 *
 *  - `'allow'` - proceed to routing.
 *  - `'deny'` - drop the message (`reason` says why).
 *  - `'pairing-challenge'` - the peer is unpaired; `code` is the
 *    (new or still-pending) pairing code. `issued` is true only when
 *    THIS check created the code - render the challenge to the peer
 *    once, not on every message.
 *
 * @stable
 */
export type ChannelAccessDecision =
  | { readonly kind: 'allow' }
  | { readonly kind: 'deny'; readonly reason: 'disabled' | 'not-allowlisted' | 'pairing-limit' }
  | {
      readonly kind: 'pairing-challenge';
      readonly code: string;
      readonly expiresAt: string;
      readonly issued: boolean;
    };

/**
 * Configuration error thrown eagerly by {@link createAccessController}.
 *
 * @stable
 */
export class ChannelAccessConfigError extends Error {
  override readonly name = 'ChannelAccessConfigError';
  constructor(message: string) {
    super(`[graphorin/channels] invalid access policy: ${message}`);
  }
}

/**
 * The access controller consumed by the gateway. `approve` and
 * `revoke` are the operator surface (CLI / REST wiring is
 * application-side).
 *
 * @stable
 */
export interface ChannelAccessController {
  readonly policy: ChannelAccessPolicyKind;
  /** Evaluate one inbound identity. Deterministic given store state + clock. */
  check(identity: ChannelIdentity): Promise<ChannelAccessDecision>;
  /**
   * Operator approval of a pairing code. One-time: consumes the
   * request and durably pairs the peer. Returns `null` when the code
   * is unknown or expired (an expired code is also deleted).
   */
  approve(channelId: string, code: string): Promise<PairedPeerRecord | null>;
  /** Remove a durably paired peer. */
  revoke(peer: PairingPeerRef): Promise<void>;
  /** List durably paired peers (operator surface). */
  listPaired(channelId?: string): Promise<ReadonlyArray<PairedPeerRecord>>;
}

/** Options for {@link createAccessController}. @stable */
export interface CreateAccessControllerOptions {
  readonly policy: ChannelAccessPolicyConfig;
  /** Required when `policy.kind` is `'pairing'`. */
  readonly store?: PairingStore;
  /** Clock seam (tests). Default `() => new Date()`. */
  readonly now?: () => Date;
  /** Code generator seam (tests). Default: crypto-random over an unambiguous alphabet. */
  readonly generateCode?: () => string;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000;
const DEFAULT_MAX_PENDING = 3;
const DEFAULT_CODE_LENGTH = 8;
/** No 0/O/1/I/L to survive human retyping from a phone screen. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Build a deterministic access controller. Throws
 * {@link ChannelAccessConfigError} when `'pairing'` lacks a store or
 * `'allowlist'` lacks entries - fail-closed at construction.
 *
 * @stable
 */
export function createAccessController(
  options: CreateAccessControllerOptions,
): ChannelAccessController {
  const { policy } = options;
  const now = options.now ?? (() => new Date());
  const ttlMs = policy.pairing?.ttlMs ?? DEFAULT_TTL_MS;
  const maxPending = policy.pairing?.maxPendingPerChannel ?? DEFAULT_MAX_PENDING;
  const codeLength = policy.pairing?.codeLength ?? DEFAULT_CODE_LENGTH;
  const generateCode = options.generateCode ?? (() => randomCode(codeLength));
  const store = options.store;

  if (policy.kind === 'pairing' && store === undefined) {
    throw new ChannelAccessConfigError(
      "policy 'pairing' requires a PairingStore (e.g. createSqliteStore(...).pairing)",
    );
  }
  if (
    policy.kind === 'allowlist' &&
    (policy.allowlist === undefined || policy.allowlist.length === 0)
  ) {
    throw new ChannelAccessConfigError(
      "policy 'allowlist' requires a non-empty allowlist - use 'disabled' to block everyone",
    );
  }

  function inAllowlist(identity: ChannelIdentity): boolean {
    return (policy.allowlist ?? []).some(
      (entry) =>
        entry.channelId === identity.channelId &&
        entry.peerId === identity.peerId &&
        (entry.accountId === undefined || entry.accountId === identity.accountId),
    );
  }

  async function checkPairing(identity: ChannelIdentity): Promise<ChannelAccessDecision> {
    if (store === undefined) throw new ChannelAccessConfigError('pairing store missing');
    if (await store.isPaired(identity)) return { kind: 'allow' };
    const at = now();
    const nowIso = at.toISOString();
    const pending = await store.findRequestByPeer(identity);
    if (pending !== null && Date.parse(pending.expiresAt) > at.getTime()) {
      return {
        kind: 'pairing-challenge',
        code: pending.code,
        expiresAt: pending.expiresAt,
        issued: false,
      };
    }
    // Opportunistic housekeeping keeps the pending cap meaningful.
    await store.pruneExpiredRequests(nowIso);
    const pendingCount = await store.countPendingRequests(identity.channelId, nowIso);
    if (pendingCount >= maxPending) {
      return { kind: 'deny', reason: 'pairing-limit' };
    }
    const expiresAt = new Date(at.getTime() + ttlMs).toISOString();
    // The (channel_id, code) unique index makes a collision loud; with
    // a 31-symbol alphabet at length 8 a retry loop is unnecessary.
    const request = {
      channelId: identity.channelId,
      accountId: identity.accountId,
      peerId: identity.peerId,
      code: generateCode(),
      createdAt: nowIso,
      expiresAt,
    };
    await store.upsertRequest(request);
    return { kind: 'pairing-challenge', code: request.code, expiresAt, issued: true };
  }

  async function check(identity: ChannelIdentity): Promise<ChannelAccessDecision> {
    switch (policy.kind) {
      case 'disabled':
        return { kind: 'deny', reason: 'disabled' };
      case 'open':
        return { kind: 'allow' };
      case 'allowlist':
        return inAllowlist(identity)
          ? { kind: 'allow' }
          : { kind: 'deny', reason: 'not-allowlisted' };
      case 'pairing':
        return checkPairing(identity);
    }
  }

  async function approve(channelId: string, code: string): Promise<PairedPeerRecord | null> {
    if (store === undefined) {
      throw new ChannelAccessConfigError("approve() requires the 'pairing' policy store");
    }
    const request = await store.findRequestByCode(channelId, code);
    if (request === null) return null;
    await store.deleteRequest(channelId, code);
    if (Date.parse(request.expiresAt) <= now().getTime()) {
      return null;
    }
    const paired: PairedPeerRecord = {
      channelId: request.channelId,
      accountId: request.accountId,
      peerId: request.peerId,
      pairedAt: now().toISOString(),
    };
    await store.addPairedPeer(paired);
    return paired;
  }

  async function revoke(peer: PairingPeerRef): Promise<void> {
    if (store === undefined) {
      throw new ChannelAccessConfigError("revoke() requires the 'pairing' policy store");
    }
    await store.removePairedPeer(peer);
  }

  async function listPaired(channelId?: string): Promise<ReadonlyArray<PairedPeerRecord>> {
    if (store === undefined) return [];
    return store.listPairedPeers(channelId);
  }

  return Object.freeze({ policy: policy.kind, check, approve, revoke, listPaired });
}
