import pkg from '../package.json' with { type: 'json' };
/**
 * `GraphorinClient` - ergonomic façade over the
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
  kindForRpcCode,
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
 *  - `'workflow'`/`<id>` ⇒ `'workflow:<id>/events'`, or
 *    `'workflow:<id>/runs/<runId>/events'` when the optional `runId`
 *    is present (the run-scoped subject advertised by the workflow
 *    execute/resume routes)
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
  | {
      readonly target: 'workflow';
      readonly id: string;
      /**
       * E-12: the server emits workflow run events ONLY on the
       * run-scoped subject (`workflow:<id>/runs/<runId>/events`)
       * advertised by `POST /v1/workflows/:id/execute` (and resume),
       * never on the base `workflow:<id>/events` subject - pass the
       * advertised `runId` to receive them.
       */
      readonly runId?: string;
    };

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
   * Session bound to the SSE fallback (IP-3): substituted into the
   * `:sessionId` slot of `sseSessionPath`. Required to connect over
   * SSE - the old client sent the literal template and could never
   * receive an event.
   */
  readonly sessionId?: string;
  /**
   * Server base URL. Examples: `'wss://graphorin.example.com'` or
   * `'http://localhost:8080'`. The path `/v1/ws` is appended for
   * the WebSocket transport.
   */
  readonly baseUrl: string;
  readonly auth: TransportAuth;
  /**
   * Transport selection. Default `'auto'`: WebSocket first, SSE
   * fallback. W-108 caveat for `'auto'`: SSE carries only the bound
   * session subject, so when a RECONNECT falls back from WS to SSE,
   * live WS subscriptions (agent / workflow subjects) cannot be
   * resumed - they are closed with a `TransportFailedError` (their
   * `for await` consumers reject immediately instead of hanging).
   * Force `'ws'` when your application depends on those subscriptions
   * surviving reconnects.
   */
  readonly transport?: TransportPreference;
  /**
   * W-152: per-subscription buffer cap. When the `for await` consumer
   * falls behind and the buffered queue reaches this many frames, the
   * subscription closes with a typed `flow-overflow` error (mirroring
   * the server's queue-overflow close) instead of growing the heap
   * without bound or silently dropping events. Default 10000 (10x the
   * server's default per-connection limit); `0` disables the cap and
   * restores the old unbounded behavior.
   */
  readonly subscriptionQueueLimit?: number;
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
  /**
   * IP-19: per-RPC reply timeout in milliseconds. When set (and > 0), an RPC
   * that receives no matching reply within this window rejects with a
   * {@link TransportFailedError} instead of hanging forever on a
   * non-responsive server. Default: unset - no timeout, so a legitimately
   * slow server reply is never aborted (opt-in).
   */
  readonly rpcTimeoutMs?: number;
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
  /** W-152: current buffered (undelivered) event-frame count. */
  readonly queuedEvents: number;
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
  /** IP-7: re-point this subscription at a new server subscriptionId. */
  __rebind(newSubscriptionId: string): void;
}

/**
 * @stable
 */
export class GraphorinClient {
  readonly #options: GraphorinClientOptions;
  readonly #pending: Map<ClientMessageId, PendingRpc> = new Map();
  readonly #subscriptions: Map<string, SubscriptionInternal> = new Map();
  /**
   * E-02: frames the server tagged with a subscriptionId the client
   * has not mapped yet. The server dispatches replayed frames (and can
   * interleave live ones) BEFORE the subscribe RPC reply lands, so
   * dropping unknown-id frames loses exactly the replay the caller
   * asked for. Held only while a subscribe RPC is in flight; flushed
   * in arrival order once the reply maps the id.
   */
  readonly #preMapBuffers: Map<string, PreMapFrame[]> = new Map();
  #pendingSubscribes = 0;
  /** IP-3: the synthetic single subscription an SSE connection carries. */
  #sseSubscription: SubscriptionInternal | undefined;
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
      clientInfo: { name: 'graphorin-client', version: pkg.version },
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
  async subscribe(
    target: SubscriptionTarget,
    opts?: { readonly sinceEventId?: string },
  ): Promise<Subscription> {
    if (this.#transport === undefined) throw new ClientNotConnectedError();
    if (this.#transport.kind === 'sse') {
      // IP-3: the SSE connection IS one implicit subscription to the
      // bound session's events. Frames arrive with a server-generated
      // subscriptionId the client cannot know upfront, so routing
      // falls through to this synthetic subscription (see
      // #handleFrame). Other subjects still require the WS transport.
      const subject = subjectFor(target);
      const boundSubject = `session:${this.#options.sessionId ?? ''}/events`;
      if (subject !== boundSubject) {
        throw new TransportFailedError(
          `subscribe('${subject}') requires the WebSocket transport - the SSE fallback carries only the bound session stream ('${boundSubject}').`,
        );
      }
      // periphery-03: a CLOSED bound subscription (a prior terminal
      // reconnect failure) must not be handed back - recreate it so a
      // recovered client delivers events again.
      if (this.#sseSubscription === undefined || this.#sseSubscription.metadata().closed) {
        this.#sseSubscription = this.#createSubscription({
          subscriptionId: '__sse__',
          subject,
          target,
          snapshotEventId: undefined,
        });
        this.#subscriptions.set('__sse__', this.#sseSubscription);
      }
      return this.#sseSubscription;
    }
    const subject = subjectFor(target);
    // IP-7: a resubscribe passes the SUBSCRIPTION's own cursor - the
    // fresh transport's lastEventId is always undefined, so the old
    // code never consulted the server replay buffer.
    const lastEventId = opts?.sinceEventId ?? this.#transport.lastEventId;
    const params: { subject: string; sinceEventId?: string } = {
      subject,
    };
    if (lastEventId !== undefined) params.sinceEventId = lastEventId;
    this.#pendingSubscribes += 1;
    try {
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
      this.#flushPreMapFrames(subscriptionId, sub);
      return sub;
    } finally {
      this.#pendingSubscribes -= 1;
      // E-02: with no subscribe in flight the buffered ids can never
      // become known - drop them instead of leaking the buffers.
      if (this.#pendingSubscribes === 0) this.#preMapBuffers.clear();
    }
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
   * does NOT carry a `resume` control message - resumes are durable
   * + idempotent + body-carrying, which maps onto the REST endpoint
   * `POST /v1/runs/:runId/resume`. Since C3/W-119 the server resumes
   * in-process suspensions for real: pass
   * `{ approvals: [{ toolCallId, granted }] }` as the directive; a run
   * whose RunState this server process does not retain answers 409
   * (`run-state-unavailable`) - resume those library-side via
   * `agent.run(savedState, { directive })`.
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
      // C3/W-119: the directive IS the body - the endpoint's strict
      // schema is `{ approvals: [{ toolCallId, granted, ... }] }`.
      body: JSON.stringify(directive ?? {}),
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
    this.#preMapBuffers.clear();
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
    // periphery-03: resume from where the bound session subscription
    // left off - without the cursor every reconnect replays the whole
    // server buffer into the consumer.
    const resumeCursor = this.#sseSubscription?.__lastEventId();
    const transport = await openSseTransport(
      {
        url,
        auth: this.#options.auth,
        // IP-3: the fetch-streaming transport uses the client's fetch
        // seam (the EventSource seam is gone with the rewrite).
        ...(this.#options.fetch !== undefined ? { fetch: this.#options.fetch } : {}),
        ...(this.#options.clientId !== undefined ? { clientId: this.#options.clientId } : {}),
        ...(resumeCursor !== undefined ? { lastEventId: resumeCursor } : {}),
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
    // IP-3: bind the session into the path - the literal template was
    // previously sent as-is, so the SSE fallback could never connect
    // to a real session stream.
    if (template.includes(':sessionId')) {
      const sessionId = this.#options.sessionId;
      if (sessionId === undefined || sessionId.length === 0) {
        throw new TransportFailedError(
          "The SSE fallback needs a session binding - pass `sessionId` in the client options (it fills ':sessionId' in sseSessionPath).",
        );
      }
      return joinUrl(
        this.#options.baseUrl,
        template.replace(':sessionId', encodeURIComponent(sessionId)),
        { ws: false },
      );
    }
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
        // IP-19: surface the server's error class (rate-limited, scope-denied,
        // auth-failed, …) instead of collapsing every RPC failure to
        // 'protocol-violation'.
        pending.reject(
          new GraphorinClientError(
            kindForRpcCode(frame.error.code),
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
      const sub = this.#subscriptions.get(frame.subscriptionId) ?? this.#sseFallback();
      if (sub !== undefined) sub.__pushLifecycle(frame);
      else this.#bufferPreMapFrame(frame.subscriptionId, frame);
      return;
    }
    if (isReplayMarkerFrame(frame)) {
      const sub = this.#subscriptions.get(frame.subscriptionId) ?? this.#sseFallback();
      if (sub !== undefined) sub.__pushReplayMarker(frame);
      else this.#bufferPreMapFrame(frame.subscriptionId, frame);
      return;
    }
    if (isEventFrame(frame)) {
      const sub = this.#subscriptions.get(frame.subscriptionId) ?? this.#sseFallback();
      if (sub !== undefined) sub.__push(frame);
      else this.#bufferPreMapFrame(frame.subscriptionId, frame);
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

  /**
   * IP-3: on the SSE transport every frame belongs to the single
   * implicit session subscription regardless of the server-generated
   * subscriptionId it carries.
   */
  #sseFallback(): SubscriptionInternal | undefined {
    return this.#transport?.kind === 'sse' ? this.#sseSubscription : undefined;
  }

  /**
   * E-02: hold a frame whose subscriptionId has no mapping yet. Only
   * meaningful while a subscribe RPC is outstanding - the server tags
   * replayed frames with the NEW subscriptionId and dispatches them
   * before the RPC reply. With no subscribe in flight the id can never
   * become known, so the frame is dropped (the pre-fix behavior).
   */
  #bufferPreMapFrame(subscriptionId: string, frame: PreMapFrame): void {
    if (this.#pendingSubscribes === 0) return;
    const buffer = this.#preMapBuffers.get(subscriptionId);
    if (buffer === undefined) {
      this.#preMapBuffers.set(subscriptionId, [frame]);
      return;
    }
    // Bound: one frame beyond the W-152 per-subscription cap, so the
    // flush trips the same deterministic flow-overflow close instead
    // of silently truncating the replay.
    const limit = this.#options.subscriptionQueueLimit ?? 10_000;
    if (limit > 0 && buffer.length > limit) return;
    buffer.push(frame);
  }

  /** E-02: deliver frames buffered before the id→subscription mapping existed. */
  #flushPreMapFrames(subscriptionId: string, sub: SubscriptionInternal): void {
    const buffered = this.#preMapBuffers.get(subscriptionId);
    if (buffered === undefined) return;
    this.#preMapBuffers.delete(subscriptionId);
    for (const frame of buffered) {
      if (isEventFrame(frame)) sub.__push(frame);
      else if (isLifecycleFrame(frame)) sub.__pushLifecycle(frame);
      else sub.__pushReplayMarker(frame);
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
        // periphery-03: on the SSE fallback the connection IS the
        // subscription - the reconnect already carried the resume
        // cursor as `Last-Event-ID`, and frames keep flowing into the
        // same bound subscription object. The RPC resubscribe below
        // would call `transport.send(...)`, which the read-only SSE
        // transport rejects; pre-fix that error CLOSED the
        // subscription and the client silently stopped delivering
        // events for the life of the object.
        if (transport.kind === 'sse') {
          // W-108: transport 'auto' can reconnect a WS-FIRST client
          // over SSE when the WS handshake flakes. SSE carries exactly
          // ONE bound-session subject ('__sse__'); a surviving WS
          // subscription (agent/workflow subject) is unreachable over
          // it - no frame will ever route to it and its consumer would
          // block in `for await` forever. Close them with a typed
          // error instead of a silent hang (and instead of an endless
          // WS retry, which would wedge against servers with WS
          // disabled): the application decides whether to reconnect
          // with `transport: 'ws'` or read the bound session subject.
          const fellBack = new TransportFailedError(
            "Reconnect fell back to SSE; WebSocket subscriptions cannot be resumed over SSE - resubscribe on the bound session subject or force transport: 'ws'.",
          );
          for (const [id, sub] of [...this.#subscriptions]) {
            if (id === '__sse__') continue;
            this.#subscriptions.delete(id);
            sub.__close('aborted', fellBack);
          }
          return;
        }
        for (const [oldId, sub] of [...this.#subscriptions]) {
          this.#subscriptions.delete(oldId);
          this.#pendingSubscribes += 1;
          try {
            // IP-7: re-establish the server-side subscription with the
            // SUBSCRIPTION's own replay cursor, then re-point the SAME
            // object at the new server id - the consumer's in-flight
            // `for await` survives and the replayed events arrive in
            // the iterator it is already reading. The old code created
            // a NEW subscription and closed this one: the consumer's
            // loop ended `{done: true}` while events piled up unread
            // in an orphan.
            const cursor = sub.__lastEventId();
            const reply = await this.#sendRpc('subscription.subscribe', {
              subject: sub.__subject(),
              ...(cursor !== undefined ? { sinceEventId: cursor } : {}),
            });
            const result = reply as { subscriptionId?: unknown };
            const newId =
              typeof result.subscriptionId === 'string' && result.subscriptionId.length > 0
                ? result.subscriptionId
                : undefined;
            if (newId === undefined) {
              throw new ProtocolViolationError('Server resubscribe reply missing subscriptionId.');
            }
            sub.__rebind(newId);
            this.#subscriptions.set(newId, sub);
            // E-02: the server replays missed frames (tagged with the
            // new id) BEFORE the RPC reply - deliver the ones buffered
            // while the mapping did not exist yet.
            this.#flushPreMapFrames(newId, sub);
          } catch (err) {
            sub.__close('aborted', err instanceof Error ? err : new Error(String(err)));
          } finally {
            this.#pendingSubscribes -= 1;
            if (this.#pendingSubscribes === 0) this.#preMapBuffers.clear();
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
    subscriptionId: string;
    readonly subject: string;
    readonly target: SubscriptionTarget;
    readonly snapshotEventId: string | undefined;
  }): SubscriptionInternal {
    const queue: ServerEventFrame[] = [];
    const lifecycle: ServerLifecycleFrame[] = [];
    const replayMarkers: ServerReplayMarkerFrame[] = [];
    const waiters: Array<{
      resolve: (value: IteratorResult<ServerEventFrame>) => void;
      reject: (err: Error) => void;
    }> = [];
    let closed = false;
    let closeError: Error | undefined;
    let lastEventId: string | undefined = args.snapshotEventId;

    const queueLimit = this.#options.subscriptionQueueLimit ?? 10_000;
    const push = (frame: ServerEventFrame): void => {
      // W-152: frames arriving after close (server-side unsubscribe is
      // async) must not keep growing a queue nobody will drain.
      if (closed) return;
      lastEventId = frame.eventId;
      const waiter = waiters.shift();
      if (waiter !== undefined) {
        waiter.resolve({ value: frame, done: false });
        return;
      }
      if (queueLimit > 0 && queue.length >= queueLimit) {
        // W-152: deterministic policy over silent loss - mirror the
        // server's queue-overflow close (4006 flow.throttled) with a
        // typed client error the pending/next for-await observes.
        close(
          'aborted',
          new GraphorinClientError(
            'flow-overflow',
            `Subscription '${args.subscriptionId}' buffered ${queue.length} events with no consumer progress (subscriptionQueueLimit=${queueLimit}). Consume the events() iterator faster, raise the limit, or set 0 to disable the cap.`,
          ),
        );
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
        // IP-19(c): a waiter blocked in next() must observe the SAME outcome a
        // fresh next() would after close - reject with closeError when the
        // stream tore down abnormally, rather than silently resolving done:true
        // and swallowing the transport/abort failure.
        if (closeError !== undefined) {
          waiter.reject(closeError);
        } else {
          waiter.resolve({ value: undefined as unknown as ServerEventFrame, done: true });
        }
      }
    };

    const sub: SubscriptionInternal = {
      get subscriptionId(): string {
        return args.subscriptionId;
      },
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
            return new Promise<IteratorResult<ServerEventFrame>>((resolve, reject) => {
              waiters.push({ resolve, reject });
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
        queuedEvents: queue.length,
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
      __rebind: (newSubscriptionId: string) => {
        args.subscriptionId = newSubscriptionId;
      },
    };
    return sub;
  }

  async #sendRpc(method: ClientMessage['method'], params?: object): Promise<unknown> {
    if (this.#transport === undefined) throw new ClientNotConnectedError();
    const id = this.#nextId();
    const frame = buildRpcFrame(method, id, params);
    const timeoutMs = this.#options.rpcTimeoutMs;
    return new Promise((resolve, reject) => {
      // IP-19: arm an optional reply timer. Wrapping resolve/reject so that
      // EVERY settle path (matching reply, disconnect, transport error) clears
      // the timer - otherwise a stray timer could reject an already-settled id.
      let timer: ReturnType<typeof setTimeout> | undefined;
      const clear = (): void => {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
      };
      const pending: PendingRpc = {
        resolve: (value) => {
          clear();
          resolve(value);
        },
        reject: (reason) => {
          clear();
          reject(reason);
        },
      };
      this.#pending.set(id, pending);
      if (timeoutMs !== undefined && timeoutMs > 0) {
        timer = setTimeout(() => {
          // Fire only if this exact request is still outstanding.
          if (this.#pending.get(id) === pending) {
            this.#pending.delete(id);
            reject(
              new TransportFailedError(
                `RPC '${method}' (id=${id}) timed out after ${timeoutMs}ms with no server reply.`,
              ),
            );
          }
        }, timeoutMs);
      }
      try {
        // Asserting non-null because we just verified above.
        (this.#transport as Transport).send(frame);
      } catch (err) {
        clear();
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

/** E-02: frame kinds the server can dispatch before the subscribe RPC reply. */
type PreMapFrame = ServerEventFrame | ServerLifecycleFrame | ServerReplayMarkerFrame;

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
      // periphery-09: the server subject grammar has NO bare `run:`
      // form - the old `run:<id>/events` fallback always failed
      // server-side with an opaque unknown-subject error. Fail fast
      // with an actionable message instead.
      throw new TypeError(
        "subscribe({ target: 'run' }) requires `sessionId` - the server subject grammar has no bare run form. " +
          "Pass { kind: 'run', runId, sessionId } or use the 'agent' target with the agent id.",
      );
    case 'workflow':
      assertNonEmpty(target.id, 'workflow.id');
      if (target.runId !== undefined) {
        assertNonEmpty(target.runId, 'workflow.runId');
        return `workflow:${target.id}/runs/${target.runId}/events`;
      }
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
        params: (params ?? {
          clientInfo: { name: 'graphorin-client', version: pkg.version },
        }) as never,
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
