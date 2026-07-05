/**
 * In-memory single-use ticket store for browser WebSocket clients.
 * The browser WebSocket API does not allow custom headers, so the
 * server issues a short-lived ticket via `POST /v1/session/ws-ticket`
 * (HTTP-authenticated); the client then attaches the value as a
 * second `Sec-WebSocket-Protocol` token (`ticket.<value>`) on the
 * upgrade request.
 *
 * Tickets:
 *   - default 5-minute TTL,
 *   - single-use (the first valid `consume()` call marks the ticket
 *     consumed; every subsequent attempt rejects),
 *   - in-memory only (server restart invalidates everything; CLI /
 *     SDK clients use HTTP bearer instead so the lost ticket window
 *     does not affect them).
 *
 * @packageDocumentation
 */

import { randomBytes } from 'node:crypto';
import type { ParsedScope } from '@graphorin/security/auth';

/**
 * Stable shape returned by {@link WsTicketStore.issue}.
 *
 * @stable
 */
export interface WsTicket {
  readonly value: string;
  readonly expiresAt: number;
  readonly issuedAt: number;
  readonly tokenId: string;
  readonly scopes: ReadonlyArray<ParsedScope>;
}

/**
 * Stable result of {@link WsTicketStore.consume}.
 *
 * @stable
 */
export type WsTicketConsumeResult =
  | { readonly ok: true; readonly ticket: WsTicket }
  | { readonly ok: false; readonly reason: 'unknown' | 'consumed' | 'expired' };

/**
 * Options accepted by {@link createWsTicketStore}.
 *
 * @stable
 */
export interface WsTicketStoreOptions {
  /** Default `300_000` (5 min). */
  readonly ttlMs?: number;
  /** Cap on the number of unconsumed tickets retained. Default `1_000`. */
  readonly maxOutstanding?: number;
  readonly now?: () => number;
  /**
   * Random-bytes generator. Tests pass a deterministic source so
   * ticket values are reproducible.
   */
  readonly randomBytes?: (length: number) => Uint8Array;
}

/**
 * Pluggable in-memory ticket store used by the WS upgrade handler +
 * the `POST /v1/session/ws-ticket` route.
 *
 * @stable
 */
export interface WsTicketStore {
  readonly ttlMs: number;
  issue(input: { readonly tokenId: string; readonly scopes: ReadonlyArray<ParsedScope> }): WsTicket;
  consume(value: string): WsTicketConsumeResult;
  /** Drop expired entries; called on every `consume()`. */
  prune(): number;
  size(): number;
}

interface InternalEntry {
  readonly ticket: WsTicket;
  consumed: boolean;
}

/**
 * Build the default in-memory ticket store. Production deployments
 * use exactly one store per process (multiple processes would each
 * issue their own tickets - there is no shared state because the
 * single-user-per-process default applies).
 *
 * @stable
 */
export function createWsTicketStore(options: WsTicketStoreOptions = {}): WsTicketStore {
  const ttlMs = options.ttlMs ?? 5 * 60_000;
  const maxOutstanding = options.maxOutstanding ?? 1_000;
  const now = options.now ?? Date.now;
  const random = options.randomBytes ?? ((n: number) => randomBytes(n));
  const entries = new Map<string, InternalEntry>();

  function evictOldest(): void {
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }

  function prune(): number {
    const cutoff = now();
    let removed = 0;
    for (const [value, entry] of entries) {
      if (entry.ticket.expiresAt <= cutoff) {
        entries.delete(value);
        removed += 1;
      }
    }
    return removed;
  }

  function issue(input: {
    readonly tokenId: string;
    readonly scopes: ReadonlyArray<ParsedScope>;
  }): WsTicket {
    prune();
    while (entries.size >= maxOutstanding) {
      evictOldest();
    }
    const issuedAt = now();
    const value = encodeTicket(random(24));
    const ticket: WsTicket = {
      value,
      issuedAt,
      expiresAt: issuedAt + ttlMs,
      tokenId: input.tokenId,
      scopes: Object.freeze(input.scopes.slice()),
    };
    entries.set(value, { ticket, consumed: false });
    return ticket;
  }

  function consume(value: string): WsTicketConsumeResult {
    const entry = entries.get(value);
    if (entry === undefined) {
      prune();
      return { ok: false, reason: 'unknown' };
    }
    if (entry.ticket.expiresAt <= now()) {
      entries.delete(value);
      prune();
      return { ok: false, reason: 'expired' };
    }
    if (entry.consumed) {
      prune();
      return { ok: false, reason: 'consumed' };
    }
    entry.consumed = true;
    prune();
    return { ok: true, ticket: entry.ticket };
  }

  return Object.freeze({
    ttlMs,
    issue,
    consume,
    prune,
    size: () => entries.size,
  });
}

function encodeTicket(bytes: Uint8Array): string {
  // URL-safe base64 - Buffer.from is available in every supported
  // Node runtime; the implementation never touches the value once
  // encoded so the choice is purely cosmetic.
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
