/**
 * Per-server WebSocket dispatcher. Owns the in-memory subscription
 * map, fans out events to matching connections, applies the
 * delivery-layer commentary-phase trace sanitization, validates
 * outbound frames against the `@graphorin/protocol` schema, and
 * exposes a tiny `emit(subject, event)` surface route handlers
 * (and the agent / workflow runtimes) consume.
 *
 * @packageDocumentation
 */

import {
  isEventFrame,
  type ServerEventFrame,
  type ServerLifecycleFrame,
  type ServerMessage,
  ServerMessageSchema,
} from '@graphorin/protocol';
import type { ParsedScope } from '@graphorin/security/auth';
import {
  createDeliveryCommentarySanitizer,
  type DeliveryCommentaryConfig,
  type DeliveryCommentarySanitizer,
} from '../commentary/index.js';
import {
  createReplayBuffer,
  type ReplayBuffer,
  type ReplayBufferOptions,
} from './replay-buffer.js';
import { isSubjectAllowed, type ParsedSubject, tryParseSubject } from './subjects.js';

/**
 * Public configuration accepted by {@link createWsDispatcher}.
 *
 * @stable
 */
export interface WsDispatcherOptions {
  readonly commentary?: DeliveryCommentaryConfig;
  readonly replayBuffer?: ReplayBufferOptions;
  /**
   * Cap on outstanding events queued for an offline subscriber.
   * Defaults to the same value as the replay buffer per-subject cap.
   */
  readonly perConnectionQueueLimit?: number;
  readonly now?: () => number;
  /**
   * Logger sink for protocol violations + dropped frames. When
   * omitted, the dispatcher is silent (production wiring uses the
   * server's structured logger).
   */
  readonly onWarn?: (event: WsDispatcherWarning) => void;
}

/**
 * Discriminator surfaced to the optional warn sink.
 *
 * @stable
 */
export type WsDispatcherWarning =
  | {
      readonly kind: 'invalid-frame';
      readonly subscriptionId: string;
      readonly issues: ReadonlyArray<string>;
    }
  | { readonly kind: 'queue-overflow'; readonly subscriptionId: string }
  | { readonly kind: 'subject-rejected'; readonly subject: string; readonly reason: string };

/**
 * Subscriber surface used by the dispatcher. Each WebSocket
 * connection wraps its `WSContext.send` in this interface so the
 * dispatcher does not depend on `@hono/node-ws` types directly.
 *
 * @stable
 */
export interface WsSubscriberHandle {
  readonly id: string;
  readonly tokenId: string;
  readonly grantedScopes: ReadonlyArray<ParsedScope>;
  /** Send a server frame; the dispatcher already validated it. */
  send(frame: ServerMessage): void;
  /** Close the underlying WebSocket with a Graphorin close code. */
  close(code: number, reason: string): void;
  /**
   * Optional buffered-byte sample. The dispatcher reads this on every
   * emit to detect sustained backpressure and close the connection
   * with the Graphorin `flow.throttled` code (4006) before the OS-
   * level send buffer collapses. Consumers backed by `@hono/node-ws`
   * can return the underlying `ws.bufferedAmount`. When the field is
   * not implemented, the dispatcher falls back to the per-connection
   * outstanding-event counter.
   */
  bufferedAmount?(): number;
}

/**
 * Snapshot of an active subscription. Surfaced via
 * {@link WsDispatcher.snapshotSubscription}.
 *
 * @stable
 */
export interface WsSubscriptionSnapshot {
  readonly subscriptionId: string;
  readonly subject: string;
  readonly subjectKind: ParsedSubject['kind'];
  readonly subscriberId: string;
  readonly tokenId: string;
  readonly createdAt: number;
  readonly lastEventId: string | undefined;
}

/**
 * Result of {@link WsDispatcher.subscribe}.
 *
 * @stable
 */
export type SubscribeResult =
  | {
      readonly ok: true;
      readonly subscription: WsSubscriptionSnapshot;
      readonly replayedCount: number;
      readonly snapshotEventId: string | undefined;
    }
  | {
      readonly ok: false;
      readonly reason:
        | 'subject-malformed'
        | 'subject-unknown'
        | 'subject-wildcard'
        | 'scope-denied';
    };

/**
 * Public surface of the dispatcher.
 *
 * @stable
 */
export interface WsDispatcher {
  readonly sanitizer: DeliveryCommentarySanitizer;
  readonly replayBuffer: ReplayBuffer;
  /**
   * Register a subscriber (one per WebSocket connection).
   * `unregister` is called on close.
   */
  registerSubscriber(handle: WsSubscriberHandle): { unregister(): void };
  /**
   * Open a new subscription for an active subscriber. Returns either
   * the subscription snapshot + replayed-event count or a typed
   * failure reason the caller maps to the appropriate close code /
   * RPC error.
   */
  subscribe(input: {
    readonly subscriberId: string;
    readonly subject: string;
    readonly subscriptionId: string;
    readonly sinceEventId?: string;
  }): SubscribeResult;
  unsubscribe(subscriptionId: string): boolean;
  /**
   * Push an event into the dispatcher. Goes through the sanitizer,
   * validates against the protocol schema, persists into the replay
   * buffer, and fans out to every matching active subscription.
   */
  emit(subject: string, frame: BareEventFrame): void;
  /** Push a lifecycle frame to a single subscription. */
  emitLifecycle(
    subscriptionId: string,
    status: ServerLifecycleFrame['status'],
    reason?: string,
  ): void;
  /** List active subscriptions for a given subscriber (diagnostics). */
  listForSubscriber(subscriberId: string): ReadonlyArray<WsSubscriptionSnapshot>;
  snapshotSubscription(subscriptionId: string): WsSubscriptionSnapshot | undefined;
  size(): { readonly subscribers: number; readonly subscriptions: number };
  /** Clear in-memory state (used during graceful shutdown). */
  shutdown(): void;
}

/**
 * Frame argument accepted by {@link WsDispatcher.emit}. The
 * dispatcher fills in `subscriptionId`, `subject`, and `eventId`.
 *
 * @stable
 */
export interface BareEventFrame {
  readonly type: string;
  readonly payload: unknown;
  readonly eventId?: string;
}

interface SubscriberRecord {
  readonly handle: WsSubscriberHandle;
  readonly subscriptions: Set<string>;
  outstandingEvents: number;
  closed: boolean;
}

interface SubscriptionRecord {
  readonly subscriberId: string;
  /** IP-18: the authenticating principal's token id (not the connection id). */
  readonly tokenId: string;
  readonly subscriptionId: string;
  readonly subject: string;
  readonly parsed: ParsedSubject;
  readonly createdAt: number;
  lastEventId: string | undefined;
}

/**
 * Build a fresh dispatcher.
 *
 * @stable
 */
export function createWsDispatcher(options: WsDispatcherOptions = {}): WsDispatcher {
  const sanitizer = createDeliveryCommentarySanitizer(options.commentary);
  const replayBuffer = createReplayBuffer(options.replayBuffer ?? {});
  const now = options.now ?? Date.now;
  const onWarn = options.onWarn;
  const perConnectionQueueLimit = options.perConnectionQueueLimit ?? 1_000;
  const subscribers = new Map<string, SubscriberRecord>();
  const subscriptions = new Map<string, SubscriptionRecord>();
  const subjectIndex = new Map<string, Set<string>>();
  let eventCounter = 0;

  function indexSubject(subject: string, subscriptionId: string): void {
    let set = subjectIndex.get(subject);
    if (set === undefined) {
      set = new Set();
      subjectIndex.set(subject, set);
    }
    set.add(subscriptionId);
  }

  function deindexSubject(subject: string, subscriptionId: string): void {
    const set = subjectIndex.get(subject);
    if (set === undefined) return;
    set.delete(subscriptionId);
    if (set.size === 0) subjectIndex.delete(subject);
  }

  function nextEventId(): string {
    eventCounter += 1;
    return `evt-${now().toString(36)}-${eventCounter.toString(36)}`;
  }

  function dispatchToSubscriber(record: SubscriptionRecord, frame: ServerMessage): void {
    const subscriber = subscribers.get(record.subscriberId);
    if (subscriber === undefined || subscriber.closed) return;
    // Per-connection backpressure: track the outstanding-event counter
    // and consult the optional `bufferedAmount()` sample. The
    // dispatcher closes the connection with the Graphorin
    // `flow.throttled` code (4006) when either signal exceeds the
    // configured limit so the client can reconnect against the
    // replay buffer instead of accumulating an unbounded send queue.
    const buffered =
      typeof subscriber.handle.bufferedAmount === 'function'
        ? subscriber.handle.bufferedAmount()
        : 0;
    if (
      subscriber.outstandingEvents >= perConnectionQueueLimit ||
      buffered >= perConnectionQueueLimit * 1024
    ) {
      onWarn?.({ kind: 'queue-overflow', subscriptionId: record.subscriptionId });
      shutdownSubscriber(subscriber, 4006, 'flow.throttled');
      return;
    }
    subscriber.outstandingEvents += 1;
    try {
      subscriber.handle.send(frame);
    } catch (err) {
      onWarn?.({ kind: 'queue-overflow', subscriptionId: record.subscriptionId });
      shutdownSubscriber(subscriber, 4006, 'flow.throttled');
      void err;
    } finally {
      subscriber.outstandingEvents = Math.max(0, subscriber.outstandingEvents - 1);
    }
  }

  function shutdownSubscriber(subscriber: SubscriberRecord, code: number, reason: string): void {
    if (subscriber.closed) return;
    subscriber.closed = true;
    try {
      subscriber.handle.close(code, reason);
    } catch {
      // ignore - we are tearing the subscriber down.
    }
    for (const id of subscriber.subscriptions) {
      const sub = subscriptions.get(id);
      if (sub !== undefined) {
        deindexSubject(sub.subject, id);
        subscriptions.delete(id);
      }
    }
    subscriber.subscriptions.clear();
    subscribers.delete(subscriber.handle.id);
  }

  function validateAndDispatch(record: SubscriptionRecord, frame: ServerMessage): void {
    const validated = ServerMessageSchema.safeParse(frame);
    if (!validated.success) {
      onWarn?.({
        kind: 'invalid-frame',
        subscriptionId: record.subscriptionId,
        issues: validated.error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`),
      });
      return;
    }
    dispatchToSubscriber(record, validated.data);
  }

  function registerSubscriber(handle: WsSubscriberHandle): { unregister(): void } {
    subscribers.set(handle.id, {
      handle,
      subscriptions: new Set(),
      outstandingEvents: 0,
      closed: false,
    });
    return {
      unregister: () => {
        const record = subscribers.get(handle.id);
        if (record === undefined) return;
        for (const id of record.subscriptions) {
          const sub = subscriptions.get(id);
          if (sub !== undefined) {
            deindexSubject(sub.subject, id);
            subscriptions.delete(id);
          }
        }
        subscribers.delete(handle.id);
      },
    };
  }

  function subscribe(input: {
    readonly subscriberId: string;
    readonly subject: string;
    readonly subscriptionId: string;
    readonly sinceEventId?: string;
  }): SubscribeResult {
    const subscriber = subscribers.get(input.subscriberId);
    if (subscriber === undefined) {
      return { ok: false, reason: 'subject-unknown' };
    }
    const parseResult = tryParseSubject(input.subject);
    if (!parseResult.ok) {
      const reason = parseResult.reason;
      onWarn?.({ kind: 'subject-rejected', subject: input.subject, reason });
      if (reason === 'wildcard-not-supported') return { ok: false, reason: 'subject-wildcard' };
      if (reason === 'unknown-subject') return { ok: false, reason: 'subject-unknown' };
      return { ok: false, reason: 'subject-malformed' };
    }
    if (!isSubjectAllowed(subscriber.handle.grantedScopes, parseResult.subject)) {
      return { ok: false, reason: 'scope-denied' };
    }
    const record: SubscriptionRecord = {
      subscriberId: input.subscriberId,
      tokenId: subscriber.handle.tokenId,
      subscriptionId: input.subscriptionId,
      subject: input.subject,
      parsed: parseResult.subject,
      createdAt: now(),
      lastEventId: undefined,
    };
    subscriptions.set(input.subscriptionId, record);
    subscriber.subscriptions.add(input.subscriptionId);
    indexSubject(input.subject, input.subscriptionId);
    const replay = replayBuffer.replay(input.subject, input.sinceEventId);
    let replayed = 0;
    let snapshotEventId: string | undefined = replay.nextEventIdHint;
    for (const event of replay.events) {
      const frame: ServerEventFrame = {
        ...event,
        subscriptionId: input.subscriptionId,
      };
      validateAndDispatch(record, frame);
      record.lastEventId = frame.eventId;
      replayed += 1;
    }
    if (replay.droppedCount > 0) {
      validateAndDispatch(record, {
        v: '1',
        kind: 'replay-marker',
        subscriptionId: input.subscriptionId,
        eventId: snapshotEventId ?? `evt-replay-${now().toString(36)}`,
        droppedCount: replay.droppedCount,
        note: `Replay buffer dropped ${replay.droppedCount} events before resume.`,
      });
      snapshotEventId = snapshotEventId ?? `evt-replay-${now().toString(36)}`;
    }
    return {
      ok: true,
      subscription: snapshotForRecord(record),
      replayedCount: replayed,
      snapshotEventId,
    };
  }

  function unsubscribe(subscriptionId: string): boolean {
    const record = subscriptions.get(subscriptionId);
    if (record === undefined) return false;
    const subscriber = subscribers.get(record.subscriberId);
    subscriber?.subscriptions.delete(subscriptionId);
    deindexSubject(record.subject, subscriptionId);
    subscriptions.delete(subscriptionId);
    return true;
  }

  function emit(subject: string, bare: BareEventFrame): void {
    const eventId = bare.eventId ?? nextEventId();
    // Buffer first so the replay layer captures every event, even
    // when there is no live subscriber. The buffered frame is
    // sanitizer-neutral (the per-subscription dispatch sanitizes
    // again on the wire so the second pass is idempotent - by
    // construction matching wraps are not re-wrapped).
    const bufferedFrame: ServerEventFrame = {
      v: '1',
      kind: 'event',
      eventId,
      subscriptionId: '__pending__',
      subject,
      type: bare.type,
      payload: bare.payload,
    };
    replayBuffer.push(subject, bufferedFrame);
    const subjectSubscribers = subjectIndex.get(subject);
    if (subjectSubscribers === undefined || subjectSubscribers.size === 0) return;
    for (const subscriptionId of subjectSubscribers) {
      const record = subscriptions.get(subscriptionId);
      if (record === undefined) continue;
      const sanitized = sanitizer.sanitize({ ...bufferedFrame, subscriptionId }, 'ws');
      validateAndDispatch(record, sanitized);
      record.lastEventId = sanitized.eventId;
      if (sanitized.eventId === eventId) continue;
    }
    void isEventFrame; // keep import warm
  }

  function emitLifecycle(
    subscriptionId: string,
    status: ServerLifecycleFrame['status'],
    reason?: string,
  ): void {
    const record = subscriptions.get(subscriptionId);
    if (record === undefined) return;
    const frame: ServerLifecycleFrame = {
      v: '1',
      kind: 'lifecycle',
      subscriptionId,
      status,
      ...(reason !== undefined ? { reason } : {}),
    };
    validateAndDispatch(record, frame);
  }

  function listForSubscriber(subscriberId: string): ReadonlyArray<WsSubscriptionSnapshot> {
    const subscriber = subscribers.get(subscriberId);
    if (subscriber === undefined) return Object.freeze([]);
    return Object.freeze(
      [...subscriber.subscriptions]
        .map((id) => subscriptions.get(id))
        .filter((entry): entry is SubscriptionRecord => entry !== undefined)
        .map(snapshotForRecord),
    );
  }

  function snapshotSubscription(subscriptionId: string): WsSubscriptionSnapshot | undefined {
    const record = subscriptions.get(subscriptionId);
    if (record === undefined) return undefined;
    return snapshotForRecord(record);
  }

  function size(): { readonly subscribers: number; readonly subscriptions: number } {
    return Object.freeze({
      subscribers: subscribers.size,
      subscriptions: subscriptions.size,
    });
  }

  function shutdown(): void {
    for (const subscription of subscriptions.values()) {
      const subscriber = subscribers.get(subscription.subscriberId);
      try {
        subscriber?.handle.send({
          v: '1',
          kind: 'lifecycle',
          subscriptionId: subscription.subscriptionId,
          status: 'aborted',
          reason: 'server-shutdown',
        });
      } catch {
        // swallow - we are tearing down.
      }
    }
    subscriptions.clear();
    subjectIndex.clear();
    subscribers.clear();
  }

  return Object.freeze({
    sanitizer,
    replayBuffer,
    registerSubscriber,
    subscribe,
    unsubscribe,
    emit,
    emitLifecycle,
    listForSubscriber,
    snapshotSubscription,
    size,
    shutdown,
  });
}

function snapshotForRecord(record: SubscriptionRecord): WsSubscriptionSnapshot {
  return Object.freeze({
    subscriptionId: record.subscriptionId,
    subject: record.subject,
    subjectKind: record.parsed.kind,
    subscriberId: record.subscriberId,
    tokenId: record.tokenId,
    createdAt: record.createdAt,
    lastEventId: record.lastEventId,
  });
}
