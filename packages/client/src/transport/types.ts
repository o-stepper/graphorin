/**
 * Common transport contract shared by the WebSocket and SSE
 * back-ends. The {@link GraphorinClient} talks to a transport
 * exclusively through this interface so the two implementations are
 * pluggable + replaceable.
 *
 * @packageDocumentation
 */

import type { ClientMessage, ServerMessage } from '@graphorin/protocol';

/**
 * Discriminator used by the public client API + diagnostics.
 *
 * @stable
 */
export type TransportKind = 'ws' | 'sse';

/**
 * Stable shape consumed by every transport implementation.
 *
 * @stable
 */
export interface TransportOptions {
  readonly url: string;
  readonly auth: TransportAuth;
  readonly fetch?: typeof fetch;
  readonly WebSocket?: typeof WebSocket;
  readonly EventSource?: typeof EventSource;
  /** Per-connection identifier surfaced on diagnostics + reconnects. */
  readonly clientId?: string;
  /**
   * Resume cursor sent as the `Last-Event-ID` header on (re)connect
   * (periphery-03). The server replays only events AFTER it from the
   * buffer - without it every SSE reconnect replays the entire
   * buffered history. Consumed by the SSE transport; ignored by WS
   * (whose resubscribe carries the cursor in the RPC).
   */
  readonly lastEventId?: string;
}

/**
 * Authentication strategy passed to a transport. The bearer-token
 * shape is consumed by both transports (WS via the
 * `Authorization` header on Node SDK clients; SSE via the
 * `Authorization` header on every fetch); the ticket-provider shape
 * is only used by the WS browser path (the WebSocket browser API
 * does not allow custom headers, so the ticket rides the
 * `Sec-WebSocket-Protocol` header).
 *
 * @stable
 */
export type TransportAuth =
  | { readonly kind: 'bearer'; readonly token: string }
  | { readonly kind: 'ticket'; readonly ticketProvider: () => Promise<string> };

/**
 * Minimal listener surface the transport invokes in lifecycle order:
 * `onOpen` ⇒ `onFrame*` (zero or more) ⇒ `onClose`. `onError` may
 * fire at any time before `onClose`.
 *
 * @stable
 */
export interface TransportListeners {
  onOpen(): void;
  onFrame(frame: ServerMessage): void;
  onError(error: Error): void;
  onClose(reason: TransportCloseReason): void;
}

/**
 * Discriminator returned via {@link TransportListeners.onClose}. The
 * client uses the discriminator to decide whether to reconnect.
 *
 * @stable
 */
export interface TransportCloseReason {
  readonly code: number;
  readonly reason: string;
  /** True when the close came from a server-side `error` frame. */
  readonly wasClean: boolean;
  /** Optional Graphorin reason discriminator, per `@graphorin/protocol`. */
  readonly graphorinReason?: string;
}

/**
 * Active transport handle. The client owns the handle and disposes
 * it via {@link Transport.close} on every cleanup path.
 *
 * @stable
 */
export interface Transport {
  readonly kind: TransportKind;
  readonly url: string;
  /**
   * Send a client → server frame. Throws when the transport is not
   * in the open state, or when the underlying back-end does not
   * support send (the SSE transport throws every send via
   * `TransportFailedError` - clients
   * should fall back to REST for control-plane operations on SSE).
   */
  send(frame: ClientMessage): void;
  close(code?: number, reason?: string): void;
  /** Last server-issued event id observed on this connection. */
  readonly lastEventId: string | undefined;
}
