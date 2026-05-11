/**
 * Pluggable event store for resumable streaming sessions.
 *
 * The Streamable HTTP transport in the MCP specification supports an
 * `Mcp-Session-Id` + `Last-Event-ID` resume handshake: when a
 * disconnect interrupts a long-running stream the client can
 * reconnect and request the server replay every event after the last
 * id it observed. The replay path requires a per-session ring buffer
 * of recent events; this module provides the {@link EventStore}
 * contract and the default in-memory implementation. Pluggable
 * adapters (a SQLite-backed store from `@graphorin/store-sqlite` for
 * cross-restart durability; a future Redis-backed store published as
 * an opt-in package) implement the same interface.
 *
 * @packageDocumentation
 */

/** Stable identifier for a single replayable event. */
export type EventId = string;

/** Stable identifier for a single resumable stream / session. */
export type StreamId = string;

/** Generic JSON-RPC message shape (intentionally narrow). */
export type JsonRpcMessage = Readonly<{ jsonrpc: '2.0' } & Record<string, unknown>>;

/**
 * Options accepted by {@link EventStore.replayEventsAfter}.
 *
 * @stable
 */
export interface ReplayEventsAfterOptions {
  /**
   * Callback invoked once per replayed event, in storage order. The
   * implementation must await the callback so the consumer can
   * back-pressure replay if needed.
   */
  send(eventId: EventId, message: JsonRpcMessage): Promise<void>;
}

/**
 * Persistence contract for resumable streaming sessions.
 *
 * Implementations MUST:
 *
 * - Assign a monotonically-increasing {@link EventId} per
 *   `(streamId)` namespace at `storeEvent(...)` time.
 * - Replay every event whose id is greater than `lastEventId`, in
 *   storage order, when {@link replayEventsAfter} is invoked.
 * - Return the {@link StreamId} the replayed events belong to so the
 *   caller can correlate the replay with the originating stream.
 *
 * Implementations MAY enforce a per-stream capacity (the default
 * in-memory store keeps a fixed-size ring buffer); evicted events
 * are unrecoverable and the next resume falls through to the
 * configured `resumeMode`.
 *
 * @stable
 */
export interface EventStore {
  storeEvent(streamId: StreamId, message: JsonRpcMessage): Promise<EventId>;
  replayEventsAfter(lastEventId: EventId, opts: ReplayEventsAfterOptions): Promise<StreamId>;
  /** Drop every entry for the supplied stream. */
  clearStream(streamId: StreamId): Promise<void>;
  /** Snapshot helper for tests and the operator dashboard. */
  size(): Promise<number>;
}
