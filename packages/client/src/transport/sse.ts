/**
 * Server-Sent-Events transport — the read-only fallback for clients
 * stuck behind proxies that block WebSocket upgrades. The transport
 * is unidirectional (server → client only); control-plane operations
 * (subscribe / abort / resume) must go through REST endpoints
 * exposed by `@graphorin/server`.
 *
 * @packageDocumentation
 */

import { isEventFrame, ServerMessageSchema } from '@graphorin/protocol';

import {
  InvalidServerFrameError,
  ProtocolViolationError,
  TransportFailedError,
} from '../errors.js';
import type { Transport, TransportListeners, TransportOptions } from './types.js';

/**
 * Open an SSE transport. Resolves once the underlying `EventSource`
 * fires `open`; rejects with a typed
 * {@link TransportFailedError} on construction failure.
 *
 * The auth strategy must be `'bearer'` — SSE has no equivalent of the
 * WebSocket ticket flow because `EventSource` does not allow custom
 * headers in browsers either. SDK / server-to-server clients should
 * use the optional `EventSource` injection seam to provide a
 * polyfill that DOES allow headers (e.g. `eventsource@2.x` on Node).
 *
 * @stable
 */
export async function openSseTransport(
  options: TransportOptions,
  listeners: TransportListeners,
): Promise<Transport> {
  if (options.auth.kind !== 'bearer') {
    throw new TransportFailedError(
      `SSE transport supports only the 'bearer' auth strategy; got '${options.auth.kind}'.`,
    );
  }
  const EventSourceImpl = options.EventSource ?? globalThis.EventSource;
  if (typeof EventSourceImpl !== 'function') {
    throw new TransportFailedError(
      'No EventSource implementation found. Pass `EventSource` via the transport options or run on a runtime that ships one (modern browsers; `eventsource` polyfill on Node).',
    );
  }
  const url = new URL(options.url);
  // Some `EventSource` polyfills accept an init dict with headers.
  let source: EventSource;
  try {
    source = new EventSourceImpl(url.toString(), {
      withCredentials: false,
      // The `headers` field is non-standard but supported by the
      // popular Node polyfills (e.g. `eventsource@^2.x`).
      headers: { Authorization: `Bearer ${options.auth.token}` },
    } as never);
  } catch (cause) {
    throw new TransportFailedError(
      `Failed to construct EventSource for '${url.toString()}'.`,
      cause instanceof Error ? { cause } : {},
    );
  }
  let openFired = false;
  let lastEventId: string | undefined;
  let closeFired = false;
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
      source.removeEventListener('open', onOpen);
      source.removeEventListener('message', onMessage);
      source.removeEventListener('error', onError);
    };
    const onOpen = (): void => {
      openFired = true;
      listeners.onOpen();
      resolve({
        kind: 'sse',
        url: url.toString(),
        send(): void {
          throw new TransportFailedError(
            'SSE transport is read-only. Use REST for control-plane operations.',
          );
        },
        close(): void {
          if (closeFired) return;
          closeFired = true;
          cleanup();
          source.close();
          listeners.onClose({ code: 1000, reason: 'client-closed', wasClean: true });
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
        fail(new ProtocolViolationError('Server sent a non-JSON SSE event.'));
        return;
      }
      const parsed = ServerMessageSchema.safeParse(payload);
      if (!parsed.success) {
        fail(
          new InvalidServerFrameError(
            'Server SSE frame failed schema validation.',
            parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          ),
        );
        return;
      }
      const frame = parsed.data;
      if (isEventFrame(frame)) {
        lastEventId = frame.eventId;
      } else if (typeof event.lastEventId === 'string' && event.lastEventId.length > 0) {
        lastEventId = event.lastEventId;
      }
      listeners.onFrame(frame);
    };
    const onError = (event: Event): void => {
      const err = new TransportFailedError('SSE error event fired.', {
        cause: event instanceof Error ? event : undefined,
      });
      if (!openFired) {
        fail(err);
        return;
      }
      if (closeFired) return;
      closeFired = true;
      cleanup();
      try {
        source.close();
      } catch {
        // EventSource.close is idempotent on every implementation we
        // care about; ignore double-close throws from polyfills.
      }
      listeners.onClose({
        code: 1006,
        reason: err.message,
        wasClean: false,
      });
    };
    source.addEventListener('open', onOpen);
    source.addEventListener('message', onMessage);
    source.addEventListener('error', onError);
  });
}
