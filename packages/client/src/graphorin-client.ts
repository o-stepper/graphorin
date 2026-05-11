/**
 * `GraphorinClient` — ergonomic façade over the
 * {@link Transport} contract. Handles:
 *
 *   - WS handshake (`openWebSocketTransport`) with optional ticket flow.
 *   - Optional SSE fallback (`openSseTransport`) for environments
 *     that block WebSocket upgrades.
 *   - JSON-RPC request / response correlation for `subscribe` /
 *     `unsubscribe` / `cancel` / `resume` / `ping` calls.
 *   - Async-iterable subscriptions (`for await (const event of
 *     sub.events())`).
 *   - Exponential-backoff reconnect with `lastEventId` resume against
 *     the server replay buffer.
 *
 * The class is intentionally small (≈ 400 LOC) so the production
 * cross-cuts (telemetry, sticky reconnect on transient errors,
 * load-shedding) live in higher-level wrappers consumers build on
 * top of `GraphorinClient` instead of leaking into the protocol
 * adapter itself.
 *
 * @packageDocumentation
 */

import {
  type ClientMessage,
  type ClientMessageId,
  isErrorFrame,
  isEventFrame,
  isLifecycleFrame,
  isPongFrame,
  isReplayMarkerFrame,
  isRpcFailure,
  isRpcSuccess,
  isSubscribedFrame,
  isUnsubscribedFrame,
  type ServerEventFrame,
  type ServerLifecycleFrame,
  type ServerMessage,
  type ServerReplayMarkerFrame,
} from '@graphorin/protocol';

import {
  ClientAbortedError,
  ClientNotConnectedError,
  GraphorinClientError,
  ProtocolViolationError,
  TransportFailedError,
} from './errors.js';
import { type BackoffPolicy, computeBackoffMs, sleep } from './reconnect.js';
import {
  openSseTransport,
  openWebSocketTransport,
  type Transport,
  type TransportAuth,
  type TransportCloseReason,
  type TransportKind,
} from './transport/index.js';

/**
 * Discriminator for the subscription target. Mirrors the strict
 * subject grammar enforced by the server:
 *  - `'session'`/`<id>` ⇒ `'session:<id>/events'`
 *  - `'agent'`/`<id>` + `runId` ⇒ `'agent:<id>/runs/<runId>/events'`
 *  - `'run'`/`<runId>` ⇒ `'session:<sessionId>/runs/<runId>/events'`
 *    (when `sessionId` is provided)
 *  - `'workflow'`/`<id>` ⇒ `'workflow:<id>/events'`
 *
 * @stable
 */
export type SubscriptionTarget =
  | { readonly target: 'session'; readonly id: string }
  | {
      readonly target: 'agent';
      readonly id: string;
      readonly runId: string;
    }
  | {
      readonly target: 'run';
      readonly runId: string;
      readonly sessionId?: string;
    }
  | { readonly target: 'workflow'; readonly id: string };

/**
 * Transport selector. `'auto'` (default) attempts a WebSocket
 * handshake first and falls back to SSE on failure.
 *
 * @stable
 */
export type TransportPreference = TransportKind | 'auto';

/**
 * Public configuration accepted by {@link GraphorinClient}.
 *
 * @stable
 */
export interface GraphorinClientOptions {
  /**
   * Server base URL. Examples: `'wss://graphorin.example.com'` or
   * `'http://localhost:8080'`. The path `/v1/ws` is appended for
   * the WebSocket transport.
   */
  readonly baseUrl: string;
  readonly auth: TransportAuth;
  readonly transport?: TransportPreference;
  /** Override the WS path (default `'/v1/ws'`). */
  readonly wsPath?: string;
  /**
   * SSE path template. The placeholder `:sessionId` is replaced at
   * subscribe time. Default: `'/v1/sessions/:sessionId/events'`.
   * Required when the transport is `'sse'` or when the WS handshake
   * fails on `'auto'`.
   */
  readonly sseSessionPath?: string;
  readonly reconnect?: BackoffPolicy;
  /** Inject a `WebSocket` constructor (Node SDKs / tests). */
  readonly WebSocket?: typeof WebSocket;
  /** Inject an `EventSource` constructor (Node SDKs / tests). */
  readonly EventSource?: typeof EventSource;
  /** Inject a `fetch` implementation (defaults to `globalThis.fetch`). */
  readonly fetch?: typeof fetch;
  /** Optional client identifier surfaced on diagnostics. */
  readonly clientId?: string;
}

/**
 * Snapshot returned by {@link Subscription.metadata}.
 *
 * @stable
 */
export interface SubscriptionMetadata {
  readonly id: string;
  readonly subject: string;
  readonly target: SubscriptionTarget;
  readonly snapshotEventId: string | undefined;
  readonly lastEventId: string | undefined;
  readonly closed: boolean;
}

/**
 * Public surface returned by {@link GraphorinClient.subscribe}.
 *
 * @stable
 */
export interface Subscription {
  readonly subscriptionId: string;
  readonly subject: string;
  events(): AsyncIterable<ServerEventFrame>;
  /**
   * Close the subscription on the server. Idempotent.
   */
  unsubscribe(): Promise<void>;
  metadata(): SubscriptionMetadata;
}

interface SubscriptionInternal extends Subscription {
  __push(frame: ServerEventFrame): void;
  __pushLifecycle(frame: ServerLifecycleFrame): void;
  __pushReplayMarker(frame: ServerReplayMarkerFrame): void;
  __close(reason: 'unsubscribed' | 'transport-closed' | 'aborted', error?: Error): void;
  __subject(): string;
  __target(): SubscriptionTarget;
  __snapshotEventId(): string | undefined;
  __lastEventId(): string | undefined;
}

/**
 * @stable
 */
export class GraphorinClient {
  readonly #options: GraphorinClientOptions;
  readonly #pending: Map<ClientMessageId, PendingRpc> = new Map();
  readonly #subscriptions: Map<string, SubscriptionInternal> = new Map();
  #transport: Transport | undefined;
  #idCounter = 0;
  #closed = false;
  #connectingPromise: Promise<void> | undefined;
  #abortController: AbortController = new AbortController();

  constructor(options: GraphorinClientOptions) {
    if (typeof options.baseUrl !== 'string' || options.baseUrl.length === 0) {
      throw new TypeError('GraphorinClient: baseUrl must be a non-empty string.');
    }
    this.#options = options;
  }

  /**
   * Open the underlying transport. Resolves once the server has
   * accepted the handshake (`'open'`); rejects with a typed
   * {@link GraphorinClientError} otherwise.
   *
   * Calling `connect()` while already connected is a no-op; calling
   * it during another `connect()` returns the same promise.
   */
  async connect(): Promise<void> {
    if (this.#closed) {
      throw new ClientAbortedError('GraphorinClient was disconnected; create a new instance.');
    }
    if (this.#transport !== undefined) return;
    if (this.#connectingPromise !== undefined) return this.#connectingPromise;
    this.#connectingPromise = (async () => {
      const preference = this.#options.transport ?? 'auto';
      try {
        if (preference === 'ws' || preference === 'auto') {
          try {
            this.#transport = await this.#openWs();
            await this.#initializeRpc();
            return;
          } catch (err) {
            if (preference === 'ws') throw err;
          }
        }
        this.#transport = await this.#openSse();
      } finally {
        this.#connectingPromise = undefined;
      }
    })();
    return this.#connectingPromise;
  }

  async #initializeRpc(): Promise<void> {
    if (this.#transport?.kind !== 'ws') return;
    await this.#sendRpc('initialize', {
      clientInfo: { name: 'graphorin-client', version: '0.1.0' },
    });
  }

  /** Send a `ping` RPC and resolve when the server replies with `pong`. */
  async ping(): Promise<void> {
    await this.#sendRpc('ping');
  }

  /**
   * Subscribe to a server-side event stream. Resolves with a
   * {@link Subscription} once the server confirms with the matching
   * `subscribed` frame; rejects when the server returns an
   * `error` instead.
   */
  async subscribe(target: SubscriptionTarget): Promise<Subscription> {
    if (this.#transport === undefined) throw new ClientNotConnectedError();
    if (this.#transport.kind === 'sse') {
      throw new TransportFailedError(
        'subscribe() requires the WebSocket transport. The SSE fallback uses GET /v1/sessions/:id/events for live events.',
      );
    }
    const subject = subjectFor(target);
    const lastEventId = this.#transport.lastEventId;
    const params: { subject: string; lastSequenceId?: number; sinceEventId?: string } = {
      subject,
    };
    if (lastEventId !== undefined) params.sinceEventId = lastEventId;
    const reply = await this.#sendRpc('subscription.subscribe', params);
    const result = reply as { subscriptionId?: unknown; snapshotEventId?: unknown };
    const subscriptionId =
      typeof result.subscriptionId === 'string' && result.subscriptionId.length > 0
        ? result.subscriptionId
        : undefined;
    if (subscriptionId === undefined) {
      throw new ProtocolViolationError('Server subscribe reply missing subscriptionId.');
    }
    const snapshotEventId =
      typeof result.snapshotEventId === 'string' ? result.snapshotEventId : undefined;
    const sub = this.#createSubscription({
      subscriptionId,
      subject,
      target,
      snapshotEventId,
    });
    this.#subscriptions.set(subscriptionId, sub);
    return sub;
  }

  /**
   * Cancel a server-side run. Sends the `run.cancel` RPC and
   * resolves with the server's `result` payload (typically
   * `{ cancelled: true, partialStateAvailable: true }`).
   */
  async cancel(
    runId: string,
    opts: {
      readonly drain?: boolean;
      readonly reason?: string;
      readonly onPendingApprovals?: 'deny' | 'preserve';
    } = {},
  ): Promise<unknown> {
    if (typeof runId !== 'string' || runId.length === 0) {
      throw new TypeError('cancel: runId must be a non-empty string.');
    }
    const params: {
      runId: string;
      drain?: boolean;
      reason?: string;
      onPendingApprovals?: 'deny' | 'preserve';
    } = { runId };
    if (opts.drain !== undefined) params.drain = opts.drain;
    if (opts.reason !== undefined) params.reason = opts.reason;
    if (opts.onPendingApprovals !== undefined) {
      params.onPendingApprovals = opts.onPendingApprovals;
    }
    return this.#sendRpc('run.cancel', params);
  }

  /**
   * Resume a paused (HITL) run. The WebSocket protocol intentionally
   * does NOT carry a `resume` control message — resumes are durable
   * + idempotent + body-carrying, which maps cleanly onto the REST
   * endpoint `POST /v1/runs/:runId/resume` (Phase 14a). The client
   * forwards the call via the supplied `fetch` implementation so
   * subscribers continue to receive events on the same WS connection.
   */
  async resume(
    runId: string,
    directive?: unknown,
    opts: { readonly idempotencyKey?: string } = {},
  ): Promise<unknown> {
    if (typeof runId !== 'string' || runId.length === 0) {
      throw new TypeError('resume: runId must be a non-empty string.');
    }
    const fetchImpl = this.#options.fetch ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
      throw new TransportFailedError(
        'No fetch implementation available; pass `fetch` via the client options.',
      );
    }
    const url = joinUrl(this.#options.baseUrl, `/v1/runs/${encodeURIComponent(runId)}/resume`, {
      ws: false,
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.#options.auth.kind === 'bearer') {
      headers.Authorization = `Bearer ${this.#options.auth.token}`;
    }
    if (opts.idempotencyKey !== undefined) headers['Idempotency-Key'] = opts.idempotencyKey;
    const res = await fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(directive === undefined ? {} : { directive }),
    });
    if (!res.ok) {
      throw new TransportFailedError(
        `resume(${runId}): server responded ${res.status} ${res.statusText}.`,
        { code: res.status },
      );
    }
    try {
      return await res.json();
    } catch {
      return undefined;
    }
  }

  /**
   * Send an MCP-compatible cancellation notification. Does not wait
   * for a server reply (notifications have no `id`).
   */
  cancelNotify(requestId: string): void {
    if (this.#transport === undefined) throw new ClientNotConnectedError();
    if (typeof requestId !== 'string' || requestId.length === 0) {
      throw new TypeError('cancelNotify: requestId must be a non-empty string.');
    }
    const frame: ClientMessage = {
      v: '1',
      jsonrpc: '2.0',
      method: 'notifications/cancelled',
      params: { requestId },
    };
    this.#transport.send(frame);
  }

  /**
   * Disconnect the underlying transport and abort every pending RPC
   * + subscription. Idempotent.
   */
  async disconnect(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    const transport = this.#transport;
    this.#transport = undefined;
    this.#abortController.abort(new ClientAbortedError());
    for (const pending of this.#pending.values()) {
      pending.reject(new ClientAbortedError('Client disconnected before reply.'));
    }
    this.#pending.clear();
    for (const sub of this.#subscriptions.values()) {
      sub.__close('aborted', new ClientAbortedError('Client disconnected.'));
    }
    this.#subscriptions.clear();
    if (transport !== undefined) {
      try {
        transport.close(1000, 'client-disconnect');
      } catch {
        // Best-effort close: never throw from disconnect().
      }
    }
  }

  /** Return the active transport kind (or `undefined` if not connected). */
  get transportKind(): TransportKind | undefined {
    return this.#transport?.kind;
  }

  // -----------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------

  async #openWs(): Promise<Transport> {
    const url = this.#wsUrl();
    const transport = await openWebSocketTransport(
      {
        url,
        auth: this.#options.auth,
        ...(this.#options.WebSocket !== undefined ? { WebSocket: this.#options.WebSocket } : {}),
        ...(this.#options.clientId !== undefined ? { clientId: this.#options.clientId } : {}),
      },
      this.#listeners('ws'),
    );
    return transport;
  }

  async #openSse(): Promise<Transport> {
    if (this.#options.auth.kind !== 'bearer') {
      throw new TransportFailedError(
        "SSE fallback requires the 'bearer' auth strategy. The WebSocket ticket flow does not extend to EventSource.",
      );
    }
    const url = this.#sseUrl();
    const transport = await openSseTransport(
      {
        url,
        auth: this.#options.auth,
        ...(this.#options.EventSource !== undefined
          ? { EventSource: this.#options.EventSource }
          : {}),
        ...(this.#options.clientId !== undefined ? { clientId: this.#options.clientId } : {}),
      },
      this.#listeners('sse'),
    );
    return transport;
  }

  #wsUrl(): string {
    const path = this.#options.wsPath ?? '/v1/ws';
    return joinUrl(this.#options.baseUrl, path, { ws: true });
  }

  #sseUrl(): string {
    const template = this.#options.sseSessionPath ?? '/v1/sessions/:sessionId/events';
    return joinUrl(this.#options.baseUrl, template, { ws: false });
  }

  #listeners(kind: TransportKind): {
    onOpen(): void;
    onFrame(frame: ServerMessage): void;
    onError(err: Error): void;
    onClose(reason: TransportCloseReason): void;
  } {
    return {
      onOpen: () => {},
      onFrame: (frame) => this.#handleFrame(frame),
      onError: (err) => this.#handleTransportError(err, kind),
      onClose: (reason) => this.#handleTransportClose(reason, kind),
    };
  }

  #handleFrame(frame: ServerMessage): void {
    if (isRpcSuccess(frame)) {
      const pending = this.#pending.get(frame.id);
      if (pending !== undefined) {
        this.#pending.delete(frame.id);
        pending.resolve(frame.result);
      }
      return;
    }
    if (isRpcFailure(frame)) {
      const pending = this.#pending.get(frame.id);
      if (pending !== undefined) {
        this.#pending.delete(frame.id);
        pending.reject(
          new GraphorinClientError(
            'protocol-violation',
            `Server returned an error for RPC '${frame.id}': ${frame.error.message} (code=${frame.error.code}).`,
          ),
        );
      }
      return;
    }
    if (isSubscribedFrame(frame)) {
      // Subscribed frames are acknowledged by the matching RPC reply.
      return;
    }
    if (isUnsubscribedFrame(frame)) {
      const sub = this.#subscriptions.get(frame.subscriptionId);
      if (sub !== undefined) {
        sub.__close('unsubscribed');
        this.#subscriptions.delete(frame.subscriptionId);
      }
      return;
    }
    if (isPongFrame(frame)) return;
    if (isLifecycleFrame(frame)) {
      const sub = this.#subscriptions.get(frame.subscriptionId);
      if (sub !== undefined) sub.__pushLifecycle(frame);
      return;
    }
    if (isReplayMarkerFrame(frame)) {
      const sub = this.#subscriptions.get(frame.subscriptionId);
      if (sub !== undefined) sub.__pushReplayMarker(frame);
      return;
    }
    if (isEventFrame(frame)) {
      const sub = this.#subscriptions.get(frame.subscriptionId);
      if (sub !== undefined) sub.__push(frame);
      return;
    }
    if (isErrorFrame(frame)) {
      const target =
        frame.subscriptionId !== undefined
          ? this.#subscriptions.get(frame.subscriptionId)
          : undefined;
      const error = new GraphorinClientError(
        'protocol-violation',
        `Server error frame: ${frame.message} (code=${frame.code}).`,
      );
      if (target !== undefined) {
        target.__close('aborted', error);
        if (frame.subscriptionId !== undefined) this.#subscriptions.delete(frame.subscriptionId);
      }
    }
  }

  #handleTransportError(err: Error, _kind: TransportKind): void {
    for (const pending of this.#pending.values()) {
      pending.reject(err);
    }
    this.#pending.clear();
  }

  async #handleTransportClose(reason: TransportCloseReason, _kind: TransportKind): Promise<void> {
    if (this.#closed) return;
    this.#transport = undefined;
    const closeError = new TransportFailedError(
      `Transport closed: ${reason.reason || reason.graphorinReason || 'unknown'} (code=${reason.code}).`,
      { code: reason.code },
    );
    // Best-effort drain of pending RPCs so callers see the failure
    // immediately rather than hanging until the reconnect window
    // closes.
    for (const pending of this.#pending.values()) {
      pending.reject(closeError);
    }
    this.#pending.clear();
    if (
      reason.graphorinReason === 'auth.required' ||
      reason.graphorinReason === 'auth.invalid' ||
      reason.graphorinReason === 'auth.revoked' ||
      reason.graphorinReason === 'protocol.violation'
    ) {
      // Fatal: stop trying to reconnect and surface the failure.
      for (const sub of this.#subscriptions.values()) {
        sub.__close('aborted', closeError);
      }
      this.#subscriptions.clear();
      return;
    }
    await this.#reconnect();
  }

  async #reconnect(): Promise<void> {
    if (this.#closed) return;
    let attempt = 0;
    while (!this.#closed) {
      attempt += 1;
      const delay = computeBackoffMs(attempt, this.#options.reconnect);
      if (delay === null) {
        const exhausted = new TransportFailedError(
          `Reconnect attempts exhausted after ${attempt - 1} retries.`,
        );
        for (const sub of this.#subscriptions.values()) {
          sub.__close('aborted', exhausted);
        }
        this.#subscriptions.clear();
        return;
      }
      try {
        await sleep(delay, this.#abortController.signal);
        await this.connect();
        // Best-effort resubscribe with the recorded lastEventId so
        // the server replays missed events from the buffer.
        const transport = this.#transport;
        if (transport === undefined) continue;
        for (const [oldId, sub] of [...this.#subscriptions]) {
          this.#subscriptions.delete(oldId);
          try {
            const replaced = await this.subscribe(sub.__target());
            // Preserve the in-flight async iterator on the new
            // subscription so consumers don't notice the reconnect.
            sub.__close('transport-closed');
            const internal = replaced as SubscriptionInternal;
            this.#subscriptions.set(internal.subscriptionId, internal);
          } catch (err) {
            sub.__close('aborted', err instanceof Error ? err : new Error(String(err)));
          }
        }
        return;
      } catch (err) {
        if (this.#closed) return;
        // Loop and retry.
        if (err instanceof ClientAbortedError) return;
      }
    }
  }

  #createSubscription(args: {
    readonly subscriptionId: string;
    readonly subject: string;
    readonly target: SubscriptionTarget;
    readonly snapshotEventId: string | undefined;
  }): SubscriptionInternal {
    const queue: ServerEventFrame[] = [];
    const lifecycle: ServerLifecycleFrame[] = [];
    const replayMarkers: ServerReplayMarkerFrame[] = [];
    const waiters: Array<(value: IteratorResult<ServerEventFrame>) => void> = [];
    let closed = false;
    let closeError: Error | undefined;
    let lastEventId: string | undefined = args.snapshotEventId;

    const push = (frame: ServerEventFrame): void => {
      lastEventId = frame.eventId;
      const waiter = waiters.shift();
      if (waiter !== undefined) {
        waiter({ value: frame, done: false });
        return;
      }
      queue.push(frame);
    };

    const close = (reason: 'unsubscribed' | 'transport-closed' | 'aborted', err?: Error): void => {
      if (closed) return;
      closed = true;
      if (err !== undefined) closeError = err;
      else if (reason === 'aborted') closeError = new ClientAbortedError();
      while (waiters.length > 0) {
        const waiter = waiters.shift();
        if (waiter === undefined) continue;
        if (closeError !== undefined) {
          waiter({ value: undefined as unknown as ServerEventFrame, done: true });
        } else {
          waiter({ value: undefined as unknown as ServerEventFrame, done: true });
        }
      }
    };

    const sub: SubscriptionInternal = {
      subscriptionId: args.subscriptionId,
      subject: args.subject,
      events: () => ({
        [Symbol.asyncIterator]: () => ({
          next: (): Promise<IteratorResult<ServerEventFrame>> => {
            const buffered = queue.shift();
            if (buffered !== undefined) {
              return Promise.resolve({ value: buffered, done: false });
            }
            if (closed) {
              if (closeError !== undefined) return Promise.reject(closeError);
              return Promise.resolve({
                value: undefined as unknown as ServerEventFrame,
                done: true,
              });
            }
            return new Promise<IteratorResult<ServerEventFrame>>((resolve) => {
              waiters.push(resolve);
            });
          },
          return: (): Promise<IteratorResult<ServerEventFrame>> => {
            close('unsubscribed');
            return Promise.resolve({ value: undefined as unknown as ServerEventFrame, done: true });
          },
        }),
      }),
      unsubscribe: async () => {
        if (closed) return;
        try {
          await this.#sendRpc('subscription.unsubscribe', {
            subscriptionId: args.subscriptionId,
          });
        } catch (err) {
          if (!(err instanceof ClientAbortedError)) throw err;
        }
        close('unsubscribed');
        this.#subscriptions.delete(args.subscriptionId);
      },
      metadata: () => ({
        id: args.subscriptionId,
        subject: args.subject,
        target: args.target,
        snapshotEventId: args.snapshotEventId,
        lastEventId,
        closed,
      }),
      __push: push,
      __pushLifecycle: (frame) => {
        lifecycle.push(frame);
        if (
          frame.status === 'completed' ||
          frame.status === 'aborted' ||
          frame.status === 'failed'
        ) {
          close(frame.status === 'completed' ? 'unsubscribed' : 'aborted');
          this.#subscriptions.delete(args.subscriptionId);
        }
      },
      __pushReplayMarker: (frame) => {
        replayMarkers.push(frame);
      },
      __close: close,
      __subject: () => args.subject,
      __target: () => args.target,
      __snapshotEventId: () => args.snapshotEventId,
      __lastEventId: () => lastEventId,
    };
    return sub;
  }

  async #sendRpc(method: ClientMessage['method'], params?: object): Promise<unknown> {
    if (this.#transport === undefined) throw new ClientNotConnectedError();
    const id = this.#nextId();
    const frame = buildRpcFrame(method, id, params);
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      try {
        // Asserting non-null because we just verified above.
        (this.#transport as Transport).send(frame);
      } catch (err) {
        this.#pending.delete(id);
        reject(err);
      }
    });
  }

  #nextId(): string {
    this.#idCounter += 1;
    const prefix = this.#options.clientId ?? 'graphorin';
    return `${prefix}-${this.#idCounter.toString(36)}`;
  }
}

interface PendingRpc {
  readonly resolve: (value: unknown) => void;
  readonly reject: (reason: Error) => void;
}

function subjectFor(target: SubscriptionTarget): string {
  switch (target.target) {
    case 'session':
      assertNonEmpty(target.id, 'session.id');
      return `session:${target.id}/events`;
    case 'agent':
      assertNonEmpty(target.id, 'agent.id');
      assertNonEmpty(target.runId, 'agent.runId');
      return `agent:${target.id}/runs/${target.runId}/events`;
    case 'run':
      assertNonEmpty(target.runId, 'run.runId');
      if (target.sessionId !== undefined) {
        assertNonEmpty(target.sessionId, 'run.sessionId');
        return `session:${target.sessionId}/runs/${target.runId}/events`;
      }
      return `run:${target.runId}/events`;
    case 'workflow':
      assertNonEmpty(target.id, 'workflow.id');
      return `workflow:${target.id}/events`;
  }
}

function assertNonEmpty(value: string, fieldName: string): void {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
  }
}

function joinUrl(baseUrl: string, path: string, opts: { readonly ws: boolean }): string {
  let normalized = baseUrl;
  if (opts.ws) {
    if (normalized.startsWith('http://')) normalized = normalized.replace(/^http:\/\//, 'ws://');
    else if (normalized.startsWith('https://'))
      normalized = normalized.replace(/^https:\/\//, 'wss://');
  } else {
    if (normalized.startsWith('ws://')) normalized = normalized.replace(/^ws:\/\//, 'http://');
    else if (normalized.startsWith('wss://'))
      normalized = normalized.replace(/^wss:\/\//, 'https://');
  }
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  const tail = path.startsWith('/') ? path : `/${path}`;
  return `${normalized}${tail}`;
}

function buildRpcFrame(
  method: ClientMessage['method'],
  id: ClientMessageId,
  params?: object,
): ClientMessage {
  switch (method) {
    case 'initialize':
      return {
        v: '1',
        jsonrpc: '2.0',
        id,
        method: 'initialize',
        params: (params ?? { clientInfo: { name: 'graphorin-client', version: '0.1.0' } }) as never,
      };
    case 'subscription.subscribe':
      return {
        v: '1',
        jsonrpc: '2.0',
        id,
        method: 'subscription.subscribe',
        params: (params ?? { subject: '' }) as never,
      };
    case 'subscription.unsubscribe':
      return {
        v: '1',
        jsonrpc: '2.0',
        id,
        method: 'subscription.unsubscribe',
        params: (params ?? { subscriptionId: '' }) as never,
      };
    case 'run.cancel':
      return {
        v: '1',
        jsonrpc: '2.0',
        id,
        method: 'run.cancel',
        params: (params ?? { runId: '' }) as never,
      };
    case 'ping':
      return {
        v: '1',
        jsonrpc: '2.0',
        id,
        method: 'ping',
        ...(params !== undefined ? { params: params as never } : {}),
      };
    case 'notifications/cancelled':
      throw new TypeError(
        "buildRpcFrame: 'notifications/cancelled' is a notification, not an RPC.",
      );
  }
  // Exhaustiveness check; should be unreachable.
  throw new TypeError(`Unknown RPC method '${method}'.`);
}
