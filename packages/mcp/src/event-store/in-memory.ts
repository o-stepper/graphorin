/**
 * In-memory {@link EventStore} implementation.
 *
 * Stores recent events per stream in a fixed-size ring buffer
 * (`capacity`, default `1024`). On overflow the oldest event is
 * evicted; the {@link InMemoryEventStore.eviction} accessor exposes
 * a per-stream eviction counter the runtime forwards to the metrics
 * registry.
 *
 * The store is the default for new {@link MCPClient} instances. For
 * cross-restart durability operators inject a SQLite-backed
 * implementation from `@graphorin/store-sqlite` once that adapter
 * ships.
 *
 * @packageDocumentation
 */

import type {
  EventId,
  EventStore,
  JsonRpcMessage,
  ReplayEventsAfterOptions,
  StreamId,
} from './types.js';

interface StoredEvent {
  readonly id: EventId;
  readonly streamId: StreamId;
  readonly message: JsonRpcMessage;
  readonly seq: number;
}

interface InMemoryEventStoreOptions {
  /** Maximum events held per `(streamId)`. Default `1024`. */
  readonly capacity?: number;
}

/**
 * Default {@link EventStore} implementation. Keeps a per-stream
 * fixed-size ring buffer of recent events.
 *
 * @stable
 */
export class InMemoryEventStore implements EventStore {
  private readonly capacity: number;
  private readonly streams = new Map<StreamId, StoredEvent[]>();
  private readonly evictionCounts = new Map<StreamId, number>();
  private seqCounter = 0;

  public constructor(opts: InMemoryEventStoreOptions = {}) {
    const capacity = opts.capacity ?? 1024;
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new TypeError('InMemoryEventStore: `capacity` must be a positive integer.');
    }
    this.capacity = capacity;
  }

  /** Per-stream eviction counter snapshot for tests + metrics. */
  public eviction(streamId: StreamId): number {
    return this.evictionCounts.get(streamId) ?? 0;
  }

  public async storeEvent(streamId: StreamId, message: JsonRpcMessage): Promise<EventId> {
    const seq = ++this.seqCounter;
    const id = `${streamId}::${seq}`;
    const event: StoredEvent = Object.freeze({ id, streamId, message, seq });
    const buffer = this.streams.get(streamId) ?? [];
    buffer.push(event);
    if (buffer.length > this.capacity) {
      const drop = buffer.length - this.capacity;
      buffer.splice(0, drop);
      this.evictionCounts.set(streamId, (this.evictionCounts.get(streamId) ?? 0) + drop);
    }
    this.streams.set(streamId, buffer);
    return id;
  }

  public async replayEventsAfter(
    lastEventId: EventId,
    opts: ReplayEventsAfterOptions,
  ): Promise<StreamId> {
    const last = this.findEvent(lastEventId);
    if (last === undefined) {
      throw new Error(
        `InMemoryEventStore: lastEventId ${JSON.stringify(lastEventId)} not found (evicted or unknown).`,
      );
    }
    const buffer = this.streams.get(last.streamId) ?? [];
    const replay: StoredEvent[] = [];
    for (const candidate of buffer) {
      if (candidate.seq > last.seq) replay.push(candidate);
    }
    for (const event of replay) {
      await opts.send(event.id, event.message);
    }
    return last.streamId;
  }

  public async clearStream(streamId: StreamId): Promise<void> {
    this.streams.delete(streamId);
    this.evictionCounts.delete(streamId);
  }

  public async size(): Promise<number> {
    let total = 0;
    for (const buffer of this.streams.values()) total += buffer.length;
    return total;
  }

  private findEvent(eventId: EventId): StoredEvent | undefined {
    for (const buffer of this.streams.values()) {
      for (const event of buffer) {
        if (event.id === eventId) return event;
      }
    }
    return undefined;
  }
}
