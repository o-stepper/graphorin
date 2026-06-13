/**
 * Hono WebSocket upgrade handler. Wires the `@hono/node-ws` adapter
 * to the dispatcher: validates the subprotocol, runs auth (bearer
 * via `requireAuth` middleware OR ticket via the in-memory store),
 * and bridges the per-connection `WSContext` callbacks to the
 * dispatcher's RPC handler.
 *
 * ## Subprotocol + browser ticket flow
 *
 * The negotiated subprotocol is always {@link SUBPROTOCOL_NAME}
 * (`graphorin.protocol.v1`) — the canonical wire contract lives in
 * `@graphorin/protocol`'s `subprotocol.ts`. Two auth paths exist:
 *
 * - **Bearer (non-browser):** the client sends `Authorization:
 *   Bearer <token>` and a single `Sec-WebSocket-Protocol:
 *   graphorin.protocol.v1` token.
 * - **Ticket (browser):** the `WebSocket` constructor cannot set
 *   headers, so the browser client offers two subprotocol tokens —
 *   `graphorin.protocol.v1` and `ticket.<value>`. The server echoes
 *   back only the canonical name (in `app.ts`'s `handleProtocols`),
 *   and {@link resolveUpgradeAuth} extracts the ticket via
 *   `parseTicketSubprotocol` and redeems it against the single-use
 *   {@link WsTicketStore}. Tickets are short-lived and one-shot to
 *   bound replay.
 *
 * @packageDocumentation
 */

import {
  ClientMessageSchema,
  closeCodeFor,
  isCancelledNotification,
  isInitializeRequest,
  isPingRequest,
  isRunCancelRequest,
  isSubscribeRequest,
  isUnsubscribeRequest,
  negotiateSubprotocol,
  parseTicketSubprotocol,
  RPC_ERROR_CODES,
  type ServerMessage,
  SUBPROTOCOL_NAME,
} from '@graphorin/protocol';
import type { ParsedScope, TokenVerifier } from '@graphorin/security/auth';
import { parseScope, scopeMatches } from '@graphorin/security/auth';
import type { Context } from 'hono';
import type { WSContext, WSEvents } from 'hono/ws';

import type { ServerVariables } from '../internal/context.js';
import type { RunStateTracker } from '../runtime/run-state.js';
import type { WsDispatcher } from './dispatcher.js';
import type { WsTicket, WsTicketStore } from './ticket.js';

/**
 * Public configuration accepted by {@link createWsUpgradeEvents}.
 *
 * @stable
 */
export interface WsUpgradeOptions {
  readonly dispatcher: WsDispatcher;
  readonly tickets: WsTicketStore;
  /**
   * Token verifier for bearer / ticket upgrades. Optional only in the
   * IP-13 no-auth loopback mode (`anonymous: true`), where there is no
   * verifier to construct and every upgrade is accepted.
   */
  readonly verifier?: TokenVerifier;
  /**
   * IP-13: authentication is disabled server-wide (`auth.kind='none'`).
   * Accept the upgrade unconditionally with a full (`admin:*`) scope grant
   * instead of silently refusing to mount the WS route. Trusted-loopback
   * / single-operator mode only.
   */
  readonly anonymous?: boolean;
  readonly runs?: RunStateTracker;
  readonly now?: () => number;
  /**
   * Subprotocol the server advertises. Defaults to
   * {@link SUBPROTOCOL_NAME}; tests can override to exercise the
   * mismatch path.
   */
  readonly serverSubprotocol?: string;
  readonly newSubscriptionId?: () => string;
  readonly newSubscriberId?: () => string;
}

/**
 * Build the `WSEvents` callback bag the Hono helper consumes. The
 * function takes the request `Context` so the upgrade can read the
 * `Authorization` header / `Sec-WebSocket-Protocol` ticket directly.
 *
 * Production wiring on `@hono/node-ws`:
 *
 * ```ts
 * const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });
 * app.get('/v1/ws', upgradeWebSocket((c) => createWsUpgradeEvents(c, deps)));
 * injectWebSocket(serve(...));
 * ```
 *
 * @stable
 */
export async function createWsUpgradeEvents(
  c: Context<{ Variables: ServerVariables }>,
  options: WsUpgradeOptions,
): Promise<WSEvents> {
  const negotiated = negotiateSubprotocol(c.req.header('sec-websocket-protocol') ?? '');
  if (negotiated === null) {
    return rejectImmediately(closeCodeFor('protocol.violation'), 'protocol.violation');
  }
  const auth = await resolveUpgradeAuth(c, options);
  if (auth.kind === 'denied') {
    return rejectImmediately(closeCodeFor(auth.reason), auth.reason);
  }

  const subscriberId = options.newSubscriberId?.() ?? defaultSubscriberId();
  const newSubscriptionId =
    options.newSubscriptionId ?? (() => defaultSubscriptionId(subscriberId));

  let unregister: (() => void) | undefined;
  let initialized = false;

  return {
    onOpen: (_event, ws) => {
      const handle = {
        id: subscriberId,
        tokenId: auth.tokenId,
        grantedScopes: auth.grantedScopes,
        send: (frame: ServerMessage) => {
          ws.send(JSON.stringify(frame));
        },
        close: (code: number, reason: string) => {
          ws.close(code, reason);
        },
        // IP-9: surface the socket's real backlog so the dispatcher's
        // backpressure threshold measures something — the synchronous
        // outstanding-events counter never accumulates.
        bufferedAmount: () => {
          const raw = (ws as { raw?: { bufferedAmount?: number } }).raw;
          return raw?.bufferedAmount ?? 0;
        },
      };
      const reg = options.dispatcher.registerSubscriber(handle);
      unregister = reg.unregister;
    },
    onMessage: (event, ws) => {
      const raw = typeof event.data === 'string' ? event.data : '';
      let payload: unknown;
      try {
        payload = JSON.parse(raw);
      } catch {
        sendRpcError(ws, undefined, RPC_ERROR_CODES.PARSE_ERROR, 'Frame is not valid JSON.');
        ws.close(closeCodeFor('protocol.violation'), 'protocol.violation');
        return;
      }
      const parsed = ClientMessageSchema.safeParse(payload);
      if (!parsed.success) {
        sendRpcError(
          ws,
          (payload as { id?: string | number } | null)?.id,
          RPC_ERROR_CODES.INVALID_REQUEST,
          'Frame failed schema validation.',
        );
        ws.close(closeCodeFor('protocol.violation'), 'protocol.violation');
        return;
      }
      const message = parsed.data;
      if (isCancelledNotification(message)) {
        // IP-8: only an initialized connection holding `agents:invoke` may
        // cancel a run. A notification carries no id, so an unauthorised one
        // is silently ignored (there is no error channel) rather than aborting
        // an arbitrary run.
        if (initialized && grantsInvokeScope(auth.grantedScopes)) {
          options.runs?.abort(message.params.requestId, 'mcp-cancel');
        }
        return;
      }
      if (!initialized && !isInitializeRequest(message) && !isPingRequest(message)) {
        // IP-21: a frame before `initialize` is a protocol-sequencing error,
        // not an auth failure — the connection is already authenticated.
        sendRpcError(
          ws,
          message.id,
          RPC_ERROR_CODES.PROTOCOL_VIOLATION,
          'Send `initialize` before any other RPC.',
        );
        return;
      }
      if (isInitializeRequest(message)) {
        initialized = true;
        sendRpcSuccess(ws, message.id, {
          serverInfo: {
            name: 'graphorin-server',
            version: '0.4.0',
          },
          capabilities: {
            subscriptions: true,
            replayBuffer: true,
            sseFallback: true,
          },
        });
        return;
      }
      if (isPingRequest(message)) {
        const nonce = message.params?.nonce;
        ws.send(
          JSON.stringify({
            v: '1',
            kind: 'pong',
            ...(nonce !== undefined ? { nonce } : {}),
          } satisfies ServerMessage),
        );
        sendRpcSuccess(ws, message.id, { ok: true });
        return;
      }
      if (isSubscribeRequest(message)) {
        const subscriptionId = newSubscriptionId();
        const result = options.dispatcher.subscribe({
          subscriberId,
          subject: message.params.subject,
          subscriptionId,
          ...(message.params.sinceEventId !== undefined
            ? { sinceEventId: message.params.sinceEventId }
            : {}),
        });
        if (!result.ok) {
          sendRpcError(
            ws,
            message.id,
            mapSubscribeErrorCode(result.reason),
            mapSubscribeErrorMessage(result.reason, message.params.subject),
          );
          return;
        }
        sendRpcSuccess(ws, message.id, {
          subscriptionId,
          subject: message.params.subject,
          snapshotEventId: result.snapshotEventId,
          replayedCount: result.replayedCount,
        });
        ws.send(
          JSON.stringify({
            v: '1',
            kind: 'subscribed',
            subscriptionId,
            subject: message.params.subject,
            ...(result.snapshotEventId !== undefined
              ? { snapshotEventId: result.snapshotEventId }
              : {}),
          } satisfies ServerMessage),
        );
        return;
      }
      if (isUnsubscribeRequest(message)) {
        const removed = options.dispatcher.unsubscribe(message.params.subscriptionId);
        if (!removed) {
          sendRpcError(
            ws,
            message.id,
            RPC_ERROR_CODES.SUBSCRIPTION_NOT_FOUND,
            `Subscription '${message.params.subscriptionId}' not active.`,
          );
          return;
        }
        sendRpcSuccess(ws, message.id, {
          subscriptionId: message.params.subscriptionId,
          unsubscribed: true,
        });
        ws.send(
          JSON.stringify({
            v: '1',
            kind: 'unsubscribed',
            subscriptionId: message.params.subscriptionId,
          } satisfies ServerMessage),
        );
        return;
      }
      if (isRunCancelRequest(message)) {
        // IP-8: mirror the REST `POST /runs/:runId/abort` scope gate so a
        // bearer token cannot abort an arbitrary run without `agents:invoke`.
        if (!grantsInvokeScope(auth.grantedScopes)) {
          sendRpcError(
            ws,
            message.id,
            RPC_ERROR_CODES.SCOPE_DENIED,
            "Token lacks required scope 'agents:invoke'.",
          );
          return;
        }
        const runId = message.params.runId;
        const aborted = options.runs?.abort(runId, message.params.reason ?? 'rpc-cancel') === true;
        if (!aborted) {
          sendRpcError(
            ws,
            message.id,
            RPC_ERROR_CODES.RUN_NOT_FOUND,
            `Run '${runId}' is not active.`,
          );
          return;
        }
        sendRpcSuccess(ws, message.id, {
          runId,
          cancelled: true,
          partialStateAvailable: true,
        });
        return;
      }
    },
    onClose: () => {
      try {
        unregister?.();
      } finally {
        unregister = undefined;
      }
    },
    onError: () => {
      try {
        unregister?.();
      } finally {
        unregister = undefined;
      }
    },
  };
}

function sendRpcSuccess(ws: WSContext, id: string | number, result: unknown): void {
  const frame: ServerMessage = { v: '1', jsonrpc: '2.0', id, result };
  ws.send(JSON.stringify(frame));
}

function sendRpcError(
  ws: WSContext,
  id: string | number | undefined,
  code: number,
  message: string,
): void {
  const frame: ServerMessage = {
    v: '1',
    jsonrpc: '2.0',
    id: id ?? 0,
    error: { code, message },
  };
  ws.send(JSON.stringify(frame));
}

function rejectImmediately(code: number, reason: string): WSEvents {
  return {
    onOpen: (_event, ws) => {
      ws.close(code, reason);
    },
  };
}

interface ResolvedUpgradeAuthOk {
  readonly kind: 'ok';
  readonly tokenId: string;
  readonly grantedScopes: ReadonlyArray<ParsedScope>;
}

interface ResolvedUpgradeAuthDenied {
  readonly kind: 'denied';
  readonly reason: 'auth.required' | 'auth.invalid' | 'auth.scope_denied';
}

type ResolvedUpgradeAuth = ResolvedUpgradeAuthOk | ResolvedUpgradeAuthDenied;

async function resolveUpgradeAuth(
  c: Context<{ Variables: ServerVariables }>,
  options: WsUpgradeOptions,
): Promise<ResolvedUpgradeAuth> {
  // Phase 14a's HTTP middleware may have already verified the
  // bearer token (`requireAuth` runs before the upgrade route on
  // the authenticated subtree); if so, reuse the result.
  const state = c.var.state;
  if (state?.auth?.kind === 'token') {
    return {
      kind: 'ok',
      tokenId: state.auth.token.tokenId,
      grantedScopes: state.auth.grantedScopes,
    };
  }
  // IP-13: no-auth loopback mode — accept the upgrade with a full scope grant
  // instead of silently failing to mount. Checked before ticket/bearer so the
  // verifier may legitimately be absent.
  if (options.anonymous === true) {
    return { kind: 'ok', tokenId: 'anonymous', grantedScopes: ANONYMOUS_WS_SCOPES };
  }
  const ticketValue = parseTicketSubprotocol(c.req.header('sec-websocket-protocol') ?? '');
  if (ticketValue !== undefined) {
    const consumed = options.tickets.consume(ticketValue);
    if (!consumed.ok) {
      return { kind: 'denied', reason: 'auth.invalid' };
    }
    return acceptTicket(consumed.ticket);
  }
  const header = c.req.header('authorization') ?? c.req.header('Authorization');
  if (header?.toLowerCase().startsWith('bearer ') === true) {
    if (options.verifier === undefined) return { kind: 'denied', reason: 'auth.required' };
    const token = header.slice(7).trim();
    const verified = await options.verifier.verify(token);
    if (!verified.ok) return { kind: 'denied', reason: 'auth.invalid' };
    return {
      kind: 'ok',
      tokenId: verified.token.tokenId,
      grantedScopes: verified.token.scopes,
    };
  }
  return { kind: 'denied', reason: 'auth.required' };
}

/**
 * IP-8: the `agents:invoke` scope required to cancel a run over the WS
 * transport — the same requirement the REST `POST /runs/:runId/abort` route
 * enforces. `scopeMatches` honours wildcards (`agents:*`, `admin:*`).
 */
const INVOKE_SCOPE: ParsedScope = parseScope('agents:invoke');

/**
 * IP-13: full scope grant handed to a no-auth (`auth.kind='none'`) upgrade.
 * `admin:*` matches every required scope, including the {@link INVOKE_SCOPE}
 * gate on run cancellation.
 */
const ANONYMOUS_WS_SCOPES: ReadonlyArray<ParsedScope> = [parseScope('admin:*')];

function grantsInvokeScope(granted: ReadonlyArray<ParsedScope>): boolean {
  for (const scope of granted) {
    if (scopeMatches(scope, INVOKE_SCOPE)) return true;
  }
  return false;
}

function acceptTicket(ticket: WsTicket): ResolvedUpgradeAuth {
  return {
    kind: 'ok',
    tokenId: ticket.tokenId,
    grantedScopes: ticket.scopes,
  };
}

function mapSubscribeErrorCode(
  reason: 'subject-malformed' | 'subject-unknown' | 'subject-wildcard' | 'scope-denied',
): number {
  switch (reason) {
    case 'scope-denied':
      return RPC_ERROR_CODES.SCOPE_DENIED;
    case 'subject-wildcard':
      return RPC_ERROR_CODES.INVALID_PARAMS;
    case 'subject-unknown':
      return RPC_ERROR_CODES.METHOD_NOT_FOUND;
    case 'subject-malformed':
      return RPC_ERROR_CODES.INVALID_PARAMS;
  }
}

function mapSubscribeErrorMessage(
  reason: 'subject-malformed' | 'subject-unknown' | 'subject-wildcard' | 'scope-denied',
  subject: string,
): string {
  switch (reason) {
    case 'scope-denied':
      return `Token lacks required scope for subject '${subject}'.`;
    case 'subject-wildcard':
      return `Wildcard subjects are not supported in this version. Subject: '${subject}'.`;
    case 'subject-unknown':
      return `Unknown subject grammar: '${subject}'.`;
    case 'subject-malformed':
      return `Subject '${subject}' is malformed.`;
  }
}

function defaultSubscriberId(): string {
  return `sub-conn-${randomToken(8)}`;
}

function defaultSubscriptionId(subscriberId: string): string {
  return `${subscriberId}-${randomToken(6)}`;
}

function randomToken(length: number): string {
  const bytes = new Uint8Array(length);
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Buffer.from(bytes).toString('hex');
}

void SUBPROTOCOL_NAME;
