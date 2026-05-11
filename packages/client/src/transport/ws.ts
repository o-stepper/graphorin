/**
 * WebSocket transport for the {@link GraphorinClient}. Speaks the
 * `graphorin.protocol.v1` subprotocol; honours the browser ticket
 * flow when the auth strategy is `'ticket'`.
 *
 * @packageDocumentation
 */

import {
  type ClientMessage,
  closeCodeReason,
  formatTicketSubprotocol,
  isErrorFrame,
  ServerMessageSchema,
  SUBPROTOCOL_NAME,
} from '@graphorin/protocol';

import {
  AuthFailedError,
  InvalidServerFrameError,
  ProtocolViolationError,
  SubprotocolMismatchError,
  TransportFailedError,
} from '../errors.js';
import type {
  Transport,
  TransportCloseReason,
  TransportListeners,
  TransportOptions,
} from './types.js';

const STATE_CONNECTING = 0;
const STATE_OPEN = 1;

/**
 * Open a WebSocket transport. Resolves once the underlying socket
 * fires `open` (i.e. the upgrade succeeded + the subprotocol matches
 * `SUBPROTOCOL_NAME`); rejects with a typed
 * {@link TransportFailedError} / {@link SubprotocolMismatchError} /
 * {@link AuthFailedError} otherwise.
 *
 * @stable
 */
export async function openWebSocketTransport(
  options: TransportOptions,
  listeners: TransportListeners,
): Promise<Transport> {
  const WebSocketImpl = options.WebSocket ?? globalThis.WebSocket;
  if (typeof WebSocketImpl !== 'function') {
    throw new TransportFailedError(
      'No WebSocket implementation found. Pass `WebSocket` via the transport options or run on a runtime that ships one (Node 22+, modern browsers).',
    );
  }

  const subprotocols: string[] = [SUBPROTOCOL_NAME];
  if (options.auth.kind === 'ticket') {
    const ticket = await options.auth.ticketProvider();
    subprotocols.push(formatTicketSubprotocol(ticket));
  }

  // Bearer-token auth on Node SDKs is encoded as a custom header on
  // the upgrade. The browser WebSocket API does not expose headers,
  // so the SDK fallback path uses the ticket strategy instead. We
  // try the 3-arg `new WebSocket(url, protocols, opts)` overload
  // first (supported by `ws` on Node + most polyfills); if the
  // implementation rejects it, we fall back to the 2-arg signature
  // and rely on the server to surface auth failures via the close
  // code (the only viable path on plain browser WebSocket).
  let socket: WebSocket;
  if (options.auth.kind === 'bearer') {
    type WsCtorWithOptions = new (
      url: string,
      protocols: ReadonlyArray<string>,
      options: { readonly headers: Readonly<Record<string, string>> },
    ) => WebSocket;
    const Ctor = WebSocketImpl as unknown as WsCtorWithOptions;
    try {
      socket = new Ctor(options.url, subprotocols, {
        headers: { Authorization: `Bearer ${options.auth.token}` },
      });
    } catch {
      try {
        socket = new WebSocketImpl(options.url, subprotocols);
      } catch (cause) {
        throw new TransportFailedError(
          `Failed to construct WebSocket for '${options.url}'.`,
          cause instanceof Error ? { cause } : {},
        );
      }
    }
  } else {
    try {
      socket = new WebSocketImpl(options.url, subprotocols);
    } catch (cause) {
      throw new TransportFailedError(
        `Failed to construct WebSocket for '${options.url}'.`,
        cause instanceof Error ? { cause } : {},
      );
    }
  }

  let lastEventId: string | undefined;
  let closeFired = false;
  let openFired = false;
  return await new Promise<Transport>((resolve, reject) => {
    const fail = (err: Error): void => {
      if (!openFired) {
        cleanup();
        reject(err);
      } else {
        listeners.onError(err);
      }
    };
    const cleanup = (): void => {
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('close', onClose);
    };
    const onOpen = (): void => {
      const negotiated = socket.protocol;
      if (negotiated !== SUBPROTOCOL_NAME) {
        socket.close(4008, 'protocol.violation');
        fail(new SubprotocolMismatchError(SUBPROTOCOL_NAME, negotiated || null));
        return;
      }
      openFired = true;
      listeners.onOpen();
      resolve({
        kind: 'ws',
        url: options.url,
        send(frame: ClientMessage): void {
          if (socket.readyState !== STATE_OPEN) {
            throw new TransportFailedError(
              `Cannot send: WebSocket is in state ${socket.readyState}.`,
            );
          }
          socket.send(JSON.stringify(frame));
        },
        close(code?: number, reason?: string): void {
          if (socket.readyState !== STATE_CONNECTING && socket.readyState !== STATE_OPEN) {
            return;
          }
          socket.close(code, reason);
        },
        get lastEventId(): string | undefined {
          return lastEventId;
        },
      });
    };
    const onMessage = (event: MessageEvent): void => {
      const raw = typeof event.data === 'string' ? event.data : '';
      let payload: unknown;
      try {
        payload = JSON.parse(raw);
      } catch {
        fail(new ProtocolViolationError('Server sent a non-JSON frame.'));
        return;
      }
      const parsed = ServerMessageSchema.safeParse(payload);
      if (!parsed.success) {
        fail(
          new InvalidServerFrameError(
            'Server frame failed schema validation.',
            parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          ),
        );
        return;
      }
      const frame = parsed.data;
      if ('kind' in frame && frame.kind === 'event') {
        lastEventId = frame.eventId;
      }
      if (isErrorFrame(frame) && frame.fatal === true) {
        listeners.onFrame(frame);
        if (frame.code.startsWith('auth.')) fail(new AuthFailedError(frame.message));
        return;
      }
      listeners.onFrame(frame);
    };
    const onError = (): void => {
      fail(new TransportFailedError('WebSocket error event fired.'));
    };
    const onClose = (event: CloseEvent): void => {
      if (closeFired) return;
      closeFired = true;
      cleanup();
      const graphorinReason = closeCodeReason(event.code);
      const reasonRecord: TransportCloseReason = {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        ...(graphorinReason !== undefined ? { graphorinReason } : {}),
      };
      if (!openFired) {
        const codeReason = closeCodeReason(event.code);
        if (codeReason?.startsWith('auth.') === true) {
          fail(new AuthFailedError(event.reason || codeReason));
          return;
        }
        fail(new TransportFailedError(event.reason || 'WebSocket closed before open.'));
        return;
      }
      listeners.onClose(reasonRecord);
    };
    socket.addEventListener('open', onOpen);
    socket.addEventListener('message', onMessage);
    socket.addEventListener('error', onError);
    socket.addEventListener('close', onClose);
  });
}
