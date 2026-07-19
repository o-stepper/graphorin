/**
 * Server-Sent-Events transport - the read-only fallback for clients
 * stuck behind proxies that block WebSocket upgrades. The transport
 * is unidirectional (server → client only); control-plane operations
 * (subscribe / abort / resume) must go through REST endpoints
 * exposed by `@graphorin/server`.
 *
 * Implemented on **fetch streaming**, not `EventSource`. The
 * server writes *named* events (`event: <frame.type>`), which an
 * `EventSource` delivers only to listeners registered per type - an
 * unbounded catalogue the old `message`-only listener never saw.
 * Every frame's full JSON rides in `data:`, so a direct SSE parse
 * that ignores the event name delivers everything - and `fetch`
 * sends the `Authorization` header natively (no polyfill seam).
 *
 * @packageDocumentation
 */

import { ServerMessageSchema } from '@graphorin/protocol';

import { InvalidServerFrameError, TransportFailedError } from '../errors.js';
import type { Transport, TransportListeners, TransportOptions } from './types.js';

/**
 * Open an SSE transport. Resolves once the server answers with a
 * streaming response; rejects with a typed
 * {@link TransportFailedError} on construction / connection failure.
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
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new TransportFailedError('No fetch implementation available for the SSE transport.');
  }
  const controller = new AbortController();
  let resp: Response;
  try {
    resp = await fetchImpl(options.url, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${options.auth.token}`,
        // periphery-03: resume from the replay buffer instead of
        // re-receiving the entire buffered history on every reconnect.
        ...(options.lastEventId !== undefined && options.lastEventId.length > 0
          ? { 'Last-Event-ID': options.lastEventId }
          : {}),
      },
      signal: controller.signal,
    });
  } catch (cause) {
    throw new TransportFailedError(
      `SSE connection to '${options.url}' failed.`,
      cause instanceof Error ? { cause } : {},
    );
  }
  if (!resp.ok || resp.body === null) {
    throw new TransportFailedError(
      `SSE endpoint '${options.url}' answered ${resp.status}${resp.body === null ? ' with no body' : ''}.`,
    );
  }

  let lastEventId: string | undefined;
  let closeFired = false;
  const close = (reason: { code: number; reason: string; wasClean: boolean }): void => {
    if (closeFired) return;
    closeFired = true;
    listeners.onClose(reason);
  };

  // Consume the stream in the background: split on newlines, parse
  // `id:` / `data:` fields, dispatch on blank lines. The `event:`
  // name is intentionally ignored - the full frame JSON is in `data:`.
  void (async () => {
    const decoder = new TextDecoder();
    let buffer = '';
    let dataLines: string[] = [];
    let pendingId: string | undefined;

    const dispatch = (): void => {
      if (dataLines.length === 0) {
        pendingId = undefined;
        return;
      }
      const raw = dataLines.join('\n');
      dataLines = [];
      const id = pendingId;
      pendingId = undefined;
      let payload: unknown;
      try {
        payload = JSON.parse(raw);
      } catch {
        // Keep-alive / non-JSON data is not a frame.
        return;
      }
      const parsed = ServerMessageSchema.safeParse(payload);
      if (!parsed.success) {
        listeners.onError(
          new InvalidServerFrameError(
            'Server SSE frame failed schema validation.',
            parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          ),
        );
        return;
      }
      const frame = parsed.data;
      const eventId = (frame as { eventId?: string }).eventId ?? id;
      if (typeof eventId === 'string' && eventId.length > 0) lastEventId = eventId;
      listeners.onFrame(frame);
    };

    try {
      for await (const chunk of resp.body as unknown as AsyncIterable<Uint8Array>) {
        buffer += decoder.decode(chunk, { stream: true });
        for (;;) {
          const nl = buffer.indexOf('\n');
          if (nl === -1) break;
          const line = buffer.slice(0, nl).replace(/\r$/, '');
          buffer = buffer.slice(nl + 1);
          if (line.length === 0) {
            dispatch();
            continue;
          }
          if (line.startsWith(':')) continue; // comment / keep-alive
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).replace(/^ /, ''));
          } else if (line.startsWith('id:')) {
            pendingId = line.slice(3).trim();
          }
          // `event:` / `retry:` fields are intentionally ignored.
        }
      }
      close({ code: 1000, reason: 'stream ended', wasClean: true });
    } catch (err) {
      if (controller.signal.aborted) {
        close({ code: 1000, reason: 'closed by client', wasClean: true });
        return;
      }
      close({
        code: 1006,
        reason: err instanceof Error ? err.message : String(err),
        wasClean: false,
      });
    }
  })();

  listeners.onOpen();
  const transport: Transport = {
    kind: 'sse',
    url: options.url,
    send: () => {
      throw new TransportFailedError(
        'The SSE transport is read-only; control-plane calls go through REST.',
      );
    },
    close: () => {
      controller.abort();
      close({ code: 1000, reason: 'closed by client', wasClean: true });
    },
    get lastEventId(): string | undefined {
      return lastEventId;
    },
  };
  return transport;
}
