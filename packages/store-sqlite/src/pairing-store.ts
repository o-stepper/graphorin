import type {
  PairedPeerRecord,
  PairingPeerRef,
  PairingRequestRecord,
  PairingStore,
} from '@graphorin/core/contracts';
import type { SqliteConnection } from './connection.js';

interface PairingRequestRow {
  channel_id: string;
  account_id: string;
  peer_id: string;
  code: string;
  created_at: number;
  expires_at: number;
}

interface PairedPeerRow {
  channel_id: string;
  account_id: string;
  peer_id: string;
  paired_at: number;
}

function requestRowToRecord(row: PairingRequestRow): PairingRequestRecord {
  return {
    channelId: row.channel_id,
    accountId: row.account_id,
    peerId: row.peer_id,
    code: row.code,
    createdAt: new Date(row.created_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
  };
}

function pairedRowToRecord(row: PairedPeerRow): PairedPeerRecord {
  return {
    channelId: row.channel_id,
    accountId: row.account_id,
    peerId: row.peer_id,
    pairedAt: new Date(row.paired_at).toISOString(),
  };
}

/**
 * Default `PairingStore` implementation (migration 034). Expiry
 * policy lives in the access controller of `@graphorin/channels`;
 * this store only filters by the timestamps it is handed.
 *
 * @stable
 */
export class SqlitePairingStore implements PairingStore {
  #conn: SqliteConnection;
  constructor(conn: SqliteConnection) {
    this.#conn = conn;
  }

  async upsertRequest(request: PairingRequestRecord): Promise<void> {
    this.#conn.run(
      `INSERT OR REPLACE INTO channel_pairing_requests (
         channel_id, account_id, peer_id, code, created_at, expires_at
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        request.channelId,
        request.accountId,
        request.peerId,
        request.code,
        Date.parse(request.createdAt),
        Date.parse(request.expiresAt),
      ],
    );
  }

  async findRequestByPeer(peer: PairingPeerRef): Promise<PairingRequestRecord | null> {
    const row = this.#conn.get<PairingRequestRow>(
      `SELECT * FROM channel_pairing_requests
       WHERE channel_id = ? AND account_id = ? AND peer_id = ?`,
      [peer.channelId, peer.accountId, peer.peerId],
    );
    return row ? requestRowToRecord(row) : null;
  }

  async findRequestByCode(channelId: string, code: string): Promise<PairingRequestRecord | null> {
    const row = this.#conn.get<PairingRequestRow>(
      'SELECT * FROM channel_pairing_requests WHERE channel_id = ? AND code = ?',
      [channelId, code],
    );
    return row ? requestRowToRecord(row) : null;
  }

  async deleteRequest(channelId: string, code: string): Promise<void> {
    this.#conn.run('DELETE FROM channel_pairing_requests WHERE channel_id = ? AND code = ?', [
      channelId,
      code,
    ]);
  }

  async countPendingRequests(channelId: string, nowIso: string): Promise<number> {
    const row = this.#conn.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM channel_pairing_requests WHERE channel_id = ? AND expires_at > ?',
      [channelId, Date.parse(nowIso)],
    );
    return row?.n ?? 0;
  }

  async pruneExpiredRequests(nowIso: string): Promise<number> {
    const before = this.#conn.get<{ n: number }>(
      'SELECT COUNT(*) AS n FROM channel_pairing_requests WHERE expires_at <= ?',
      [Date.parse(nowIso)],
    );
    this.#conn.run('DELETE FROM channel_pairing_requests WHERE expires_at <= ?', [
      Date.parse(nowIso),
    ]);
    return before?.n ?? 0;
  }

  async addPairedPeer(peer: PairedPeerRecord): Promise<void> {
    this.#conn.run(
      `INSERT OR REPLACE INTO channel_paired_peers (
         channel_id, account_id, peer_id, paired_at
       ) VALUES (?, ?, ?, ?)`,
      [peer.channelId, peer.accountId, peer.peerId, Date.parse(peer.pairedAt)],
    );
  }

  async isPaired(peer: PairingPeerRef): Promise<boolean> {
    const row = this.#conn.get<{ n: number }>(
      `SELECT COUNT(*) AS n FROM channel_paired_peers
       WHERE channel_id = ? AND account_id = ? AND peer_id = ?`,
      [peer.channelId, peer.accountId, peer.peerId],
    );
    return (row?.n ?? 0) > 0;
  }

  async removePairedPeer(peer: PairingPeerRef): Promise<void> {
    this.#conn.run(
      `DELETE FROM channel_paired_peers
       WHERE channel_id = ? AND account_id = ? AND peer_id = ?`,
      [peer.channelId, peer.accountId, peer.peerId],
    );
  }

  async listPairedPeers(channelId?: string): Promise<ReadonlyArray<PairedPeerRecord>> {
    const rows =
      channelId === undefined
        ? this.#conn.all<PairedPeerRow>(
            'SELECT * FROM channel_paired_peers ORDER BY channel_id, account_id, peer_id',
          )
        : this.#conn.all<PairedPeerRow>(
            'SELECT * FROM channel_paired_peers WHERE channel_id = ? ORDER BY account_id, peer_id',
            [channelId],
          );
    return rows.map(pairedRowToRecord);
  }
}
