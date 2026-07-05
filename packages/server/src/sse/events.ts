/**
 * Server-Sent Events fallback for non-WebSocket-friendly clients.
 *
 * The endpoint is unidirectional: the server pushes
 * `ServerMessage` event frames; control-plane operations
 * (subscribe / unsubscribe / abort / resume) go through REST.
 *
 * Unlike the WS surface, the SSE responder is not multiplexed -
 * one HTTP request per session subject. Reconnection is handled by
 * the standard EventSource `Last-Event-ID` mechanism: when the
 * client supplies the header on resume, the responder walks the
 * dispatcher's replay buffer from that cursor.
 *
 * @packageDocumentation
 */

import {
  isEventFrame,
  isLifecycleFrame,
  type ServerEventFrame,
  type ServerMessage,
  ServerMessageSchema,
} from '@graphorin/protocol';
import type { Context, MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import type { StreamingApi } from 'hono/utils/stream';

import {
  createDeliveryCommentarySanitizer,
  type DeliveryCommentaryConfig,
  type DeliveryCommentarySanitizer,
} from '../commentary/index.js';
import type { ServerVariables } from '../internal/context.js';
import { createScopeMiddleware } from '../middleware/scope.js';
import type { WsDispatcher } from '../ws/dispatcher.js';

/**
 * Stable shape consumed by {@link createSseRoutes}.
 *
 * @stable
 */
export interface SseRoutesDeps {
  /**
   * Cap on the per-connection SSE delivery queue (IP-9). A consumer
   * that stops reading past this many buffered frames is closed
   * instead of growing the queue without bound. Default 1000.
   */
  readonly perConnectionQueueLimit?: number;
  readonly dispatcher: WsDispatcher;
  readonly commentary?: DeliveryCommentaryConfig;
  /**
   * How long the SSE responder waits between heartbeat comments to
   * keep proxies / load balancers from closing the idle connection.
   * Default `15_000` ms.
   */
  readonly keepAliveMs?: number;
  readonly now?: () => number;
}

/**
 * Build the SSE event-stream router. Mounts
 * `GET /sessions/:id/events` (the canonical path documented in the
 * runtime spec); operators that want a different path should mount
 * the router under a custom prefix.
 *
 * @stable
 */
export function createSseRoutes(deps: SseRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const sanitizer: DeliveryCommentarySanitizer =
    deps.dispatcher.sanitizer.applyToEvents.length > 0
      ? deps.dispatcher.sanitizer
      : createDeliveryCommentarySanitizer(deps.commentary);
  const keepAliveMs = deps.keepAliveMs ?? 15_000;

  const app = new Hono<{ Variables: ServerVariables }>();
  app.get(
    '/:id/events',
    createScopeMiddleware('sessions:read'),
    sseHandler(deps.dispatcher, sanitizer, keepAliveMs, deps.perConnectionQueueLimit ?? 1000),
  );
  return app;
}

function sseHandler(
  dispatcher: WsDispatcher,
  sanitizer: DeliveryCommentarySanitizer,
  keepAliveMs: number,
  perConnectionQueueLimit: number,
): MiddlewareHandler<{ Variables: ServerVariables }> {
  return async (c: Context<{ Variables: ServerVariables }>) => {
    const sessionId = c.req.param('id');
    if (sessionId === undefined || sessionId.length === 0) {
      return c.json(
        { error: 'session-id-required', message: 'Path parameter :id is required.' },
        400,
      );
    }
    const subject = `session:${sessionId}/events`;
    const sinceEventId = c.req.header('last-event-id') ?? c.req.header('Last-Event-ID');

    c.header('Content-Type', 'text/event-stream; charset=utf-8');
    c.header('Cache-Control', 'no-cache, no-transform');
    c.header('Connection', 'keep-alive');
    c.header('X-Accel-Buffering', 'no');

    return stream(c, async (writer) => {
      const replay = dispatcher.replayBuffer.replay(subject, sinceEventId);
      let lastEventId: string | undefined;
      for (const frame of replay.events) {
        const sanitized = sanitizer.sanitize({ ...frame, subscriptionId: 'sse' }, 'sse');
        await writeFrame(writer as StreamingApi, sanitized);
        lastEventId = sanitized.eventId;
      }
      if (replay.droppedCount > 0) {
        await writeReplayMarker(writer as StreamingApi, replay.droppedCount, lastEventId);
      }
      // Live tail - register a synthetic subscription so the
      // dispatcher fans new events into this connection. The
      // dispatcher already validates + sanitizes every frame; here we
      // just write the bytes onto the wire.
      const subscriberId = `sse-${Math.random().toString(36).slice(2, 10)}`;
      const subscriptionId = `${subscriberId}-sub`;
      const authState = c.get('state').auth;
      // IP-13: the anonymous (auth.kind='none') principal carries `admin:*` in
      // grantedScopes, so the dispatcher's per-subject scope check still passes.
      const grantedScopes =
        authState.kind === 'token' || authState.kind === 'anonymous' ? authState.grantedScopes : [];
      const tokenId =
        authState.kind === 'token'
          ? authState.token.tokenId
          : authState.kind === 'anonymous'
            ? 'anonymous'
            : 'sse-anon';
      let queue: ServerMessage[] = [];
      let closedByBackpressure = false;
      const queueLimit = perConnectionQueueLimit;
      let resumeNotify: (() => void) | undefined;
      const notify = (): void => {
        if (resumeNotify !== undefined) {
          const fn = resumeNotify;
          resumeNotify = undefined;
          fn();
        }
      };
      const handle = {
        id: subscriberId,
        tokenId,
        // The strict-mode subscribe path enforces scope; we trust the
        // outer middleware (`createScopeMiddleware('sessions:read')`)
        // to gate this handler so we forward an empty scope set -
        // the dispatcher's per-subject scope check still requires
        // the `agents:invoke:<sessionId>` grant.
        grantedScopes,
        send: (frame: ServerMessage) => {
          // IP-9: bound the queue - a stalled consumer is closed, not
          // buffered into the heap forever.
          if (queue.length >= queueLimit) {
            closedByBackpressure = true;
            queue = [];
            notify();
            return;
          }
          queue.push(frame);
          notify();
        },
        close: () => {
          queue = [];
          notify();
        },
      };
      const reg = dispatcher.registerSubscriber(handle);
      const result = dispatcher.subscribe({
        subscriberId,
        subject,
        subscriptionId,
        ...(lastEventId !== undefined ? { sinceEventId: lastEventId } : {}),
      });
      if (!result.ok) {
        reg.unregister();
        await writer.write(
          encodeSse({
            event: 'error',
            data: JSON.stringify({
              error: 'sse-subscribe-failed',
              reason: result.reason,
            }),
          }),
        );
        await writer.close();
        return;
      }
      const heartbeat = setInterval(() => {
        // Fire-and-forget heartbeat comment - clients ignore comment
        // lines (RFC 6455 § 9.1).
        writer.write(': keep-alive\n\n').catch(() => undefined);
      }, keepAliveMs);
      let aborted = false;
      const onAbort = (): void => {
        aborted = true;
        notify();
      };
      c.req.raw.signal.addEventListener('abort', onAbort, { once: true });
      try {
        while (!aborted) {
          if (closedByBackpressure) {
            // IP-9: the consumer stalled past the queue cap - close the
            // stream with a terminal lifecycle frame instead of
            // buffering unboundedly.
            await writer.write(
              encodeSse({
                event: 'lifecycle',
                data: JSON.stringify({
                  kind: 'lifecycle',
                  subscriptionId,
                  status: 'failed',
                  reason: 'flow.throttled',
                }),
              }),
            );
            aborted = true;
            continue;
          }
          if (queue.length > 0) {
            const next = queue.shift();
            if (next === undefined) continue;
            if (isEventFrame(next)) {
              await writeFrame(writer as StreamingApi, next);
            } else if (isLifecycleFrame(next)) {
              await writer.write(
                encodeSse({
                  event: 'lifecycle',
                  data: JSON.stringify(next),
                }),
              );
              if (
                next.status === 'completed' ||
                next.status === 'aborted' ||
                next.status === 'failed'
              ) {
                aborted = true;
              }
            }
            continue;
          }
          await new Promise<void>((resolve) => {
            resumeNotify = resolve;
          });
        }
      } finally {
        clearInterval(heartbeat);
        c.req.raw.signal.removeEventListener('abort', onAbort);
        dispatcher.unsubscribe(subscriptionId);
        reg.unregister();
      }
    });
  };
}

async function writeFrame(writer: StreamingApi, frame: ServerEventFrame): Promise<void> {
  const validated = ServerMessageSchema.safeParse(frame);
  if (!validated.success) return;
  await writer.write(
    encodeSse({
      event: frame.type,
      id: frame.eventId,
      data: JSON.stringify(frame),
    }),
  );
}

async function writeReplayMarker(
  writer: StreamingApi,
  droppedCount: number,
  lastEventId: string | undefined,
): Promise<void> {
  await writer.write(
    encodeSse({
      ...(lastEventId !== undefined ? { id: lastEventId } : {}),
      event: 'replay-marker',
      data: JSON.stringify({
        v: '1',
        kind: 'replay-marker',
        subscriptionId: 'sse',
        eventId: lastEventId ?? `evt-replay-${Date.now().toString(36)}`,
        droppedCount,
      }),
    }),
  );
}

function encodeSse(frame: { event?: string; id?: string; data: string }): string {
  let out = '';
  if (frame.event !== undefined) out += `event: ${frame.event}\n`;
  if (frame.id !== undefined) out += `id: ${frame.id}\n`;
  for (const line of frame.data.split('\n')) {
    out += `data: ${line}\n`;
  }
  out += '\n';
  return out;
}
