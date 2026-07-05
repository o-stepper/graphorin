/**
 * WebSocket layer construction for `createServer({...})` - dispatcher,
 * single-use ticket store, the `@hono/node-ws` adapter, and the
 * Graphorin-aware subprotocol negotiation policy. Built before the
 * listener starts; the upgrade route itself is mounted in
 * `app-routes.ts` and the adapter is injected into the Node server in
 * `app-lifecycle.ts`.
 *
 * @packageDocumentation
 */

import { negotiateSubprotocol, SUBPROTOCOL_NAME } from '@graphorin/protocol';
import { createNodeWebSocket } from '@hono/node-ws';
import type { Hono } from 'hono';
import { createLateBoundCommentarySink, type LateBoundCommentarySink } from './commentary/index.js';
import type { ServerConfigSpec } from './config.js';
import type { ServerVariables } from './internal/context.js';
import {
  createWsDispatcher,
  createWsTicketStore,
  type WsDispatcher,
  type WsTicketStore,
} from './ws/index.js';

/**
 * Everything the WebSocket layer contributes to the composed server.
 * Every member is `undefined` when `server.ws.enabled` is false.
 */
export interface WsLayer {
  readonly dispatcher: WsDispatcher | undefined;
  readonly tickets: WsTicketStore | undefined;
  readonly wsAdapter: ReturnType<typeof createNodeWebSocket> | undefined;
  readonly commentaryAuditSink: LateBoundCommentarySink | undefined;
}

/**
 * Build the WS dispatcher + ticket store + node-ws adapter when
 * `server.ws.enabled` is true.
 */
export function buildWsLayer(
  app: Hono<{ Variables: ServerVariables }>,
  config: ServerConfigSpec,
  now: () => number,
): WsLayer {
  let dispatcher: WsDispatcher | undefined;
  let tickets: WsTicketStore | undefined;
  let wsAdapter: ReturnType<typeof createNodeWebSocket> | undefined;
  // IP-21: the dispatcher is built here, before the audit DB opens in start().
  // Hand it a late-bound commentary sink now and install the audit-writing
  // target once the DB exists - otherwise the sanitizer's documented decisions
  // (wrapped/stripped frames with before/after digests) are dropped.
  let commentaryAuditSink: LateBoundCommentarySink | undefined;
  if (config.server.ws.enabled) {
    commentaryAuditSink = createLateBoundCommentarySink();
    dispatcher = createWsDispatcher({
      commentary: {
        policy: config.server.ws.commentarySanitization.policy,
        applyToEvents: config.server.ws.commentarySanitization.applyToEvents,
        sink: commentaryAuditSink,
      },
      replayBuffer: {
        maxEvents: config.server.stream.replayBuffer.maxEvents,
        ttlMs: config.server.stream.replayBuffer.ttlSeconds * 1000,
      },
      perConnectionQueueLimit: config.server.stream.perConnectionQueueLimit,
      now,
    });
    tickets = createWsTicketStore({
      ttlMs: config.server.ws.ticketTtlMs,
      now,
    });
    wsAdapter = createNodeWebSocket({ app });
    // The WS server inside @hono/node-ws is created without any
    // subprotocol-negotiation policy; without one, the `ws` library
    // never echoes back `Sec-WebSocket-Protocol` and clients that
    // advertised a subprotocol close the connection immediately.
    // Mutate the options to install a Graphorin-aware policy that
    // selects `graphorin.protocol.v1` when the client offered it.
    const wssOptions = (
      wsAdapter.wss as unknown as {
        options: {
          handleProtocols?: (
            protocols: Set<string>,
            request: import('node:http').IncomingMessage,
          ) => string | false;
        };
      }
    ).options;
    wssOptions.handleProtocols = (protocols) => {
      const negotiated = negotiateSubprotocol(Array.from(protocols));
      if (negotiated !== null) return negotiated;
      // Browser ticket flow: the `WebSocket` constructor cannot set an
      // `Authorization` header, so the browser client offers two
      // subprotocol tokens - the canonical `graphorin.protocol.v1`
      // name plus a `ticket.<value>` token (see the wire contract in
      // `@graphorin/protocol`'s `subprotocol.ts`:
      // `SUBPROTOCOL_NAME` / `TICKET_SUBPROTOCOL_PREFIX` /
      // `parseTicketSubprotocol`). The server MUST echo back exactly
      // the canonical name (never the `ticket.*` token) so the
      // handshake's `Sec-WebSocket-Protocol` response stays valid; the
      // ticket value is consumed separately by `createWsUpgradeEvents`
      // via `parseTicketSubprotocol` and exchanged through the
      // single-use `WsTicketStore`.
      for (const candidate of protocols) {
        if (candidate === SUBPROTOCOL_NAME) return SUBPROTOCOL_NAME;
      }
      return false;
    };
  }
  return { dispatcher, tickets, wsAdapter, commentaryAuditSink };
}
