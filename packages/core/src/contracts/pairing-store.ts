/**
 * Channel pairing persistence. Backs the default `'pairing'` access
 * policy of the channel gateway (`@graphorin/channels`): an unknown
 * peer's first contact creates a short-lived pairing request; the
 * operator approves the code out-of-band; the peer becomes durable
 * paired. Default impl lives in `@graphorin/store-sqlite`.
 *
 * The peer reference triple mirrors `ChannelIdentity` from
 * `@graphorin/channels` structurally (core takes no dependency on
 * the channels package).
 *
 * @stable
 */
export interface PairingPeerRef {
  readonly channelId: string;
  readonly accountId: string;
  readonly peerId: string;
}

/**
 * A pending pairing request. At most one per peer (upsert replaces);
 * codes are unique per channel and single-use.
 *
 * @stable
 */
export interface PairingRequestRecord extends PairingPeerRef {
  readonly code: string;
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
  /** ISO-8601 expiry; expired requests are dead even if still stored. */
  readonly expiresAt: string;
}

/**
 * A durably paired peer.
 *
 * @stable
 */
export interface PairedPeerRecord extends PairingPeerRef {
  /** ISO-8601 pairing timestamp. */
  readonly pairedAt: string;
}

/**
 * Pluggable persistent storage for channel pairing. Expiry POLICY
 * lives in the access controller (`@graphorin/channels`), which
 * injects its clock; the store only filters by the timestamps it is
 * handed so behavior stays deterministic under test.
 *
 * @stable
 */
export interface PairingStore {
  /** Insert or replace the (single) pending request for the peer. */
  upsertRequest(request: PairingRequestRecord): Promise<void>;
  findRequestByPeer(peer: PairingPeerRef): Promise<PairingRequestRecord | null>;
  findRequestByCode(channelId: string, code: string): Promise<PairingRequestRecord | null>;
  deleteRequest(channelId: string, code: string): Promise<void>;
  /** Count pending requests on a channel whose `expiresAt` is after `nowIso`. */
  countPendingRequests(channelId: string, nowIso: string): Promise<number>;
  /** Delete requests whose `expiresAt` is at or before `nowIso`; returns the number removed. */
  pruneExpiredRequests(nowIso: string): Promise<number>;
  addPairedPeer(peer: PairedPeerRecord): Promise<void>;
  isPaired(peer: PairingPeerRef): Promise<boolean>;
  removePairedPeer(peer: PairingPeerRef): Promise<void>;
  listPairedPeers(channelId?: string): Promise<ReadonlyArray<PairedPeerRecord>>;
}
