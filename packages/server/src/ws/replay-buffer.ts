/**
 * Per-subscription replay buffer used by the dispatcher to support
 * short-disconnect resume. When a client reconnects with a
 * `lastEventId`, the dispatcher walks the buffer from the matching
 * cursor and re-emits every event the client missed.
 *
 * Defaults (configurable per-server):
 *  - `maxEvents`: 1000 (per subscription)
 *  - `ttlMs`: 5 minutes
 *
 * @packageDocumentation
 */

import type { ServerEventFrame } from '@graphorin/protocol';

/**
 * Public configuration accepted by {@link createReplayBuffer}.
 *
 * @stable
 */
export interface ReplayBufferOptions {
  readonly maxEvents?: number;
  readonly ttlMs?: number;
  readonly now?: () => number;
}

/**
 * Snapshot returned by {@link ReplayBuffer.replay}.
 *
 * @stable
 */
export interface ReplayBufferSlice {
  readonly events: ReadonlyArray<ServerEventFrame>;
  readonly droppedCount: number;
  readonly nextEventIdHint: string | undefined;
}

/**
 * Occupancy snapshot returned by {@link ReplayBuffer.stats}.
 *
 * @stable
 */
export interface ReplayBufferStats {
  /** Number of subjects currently holding at least one buffered event. */
  readonly subjects: number;
  /** Total buffered events across all subjects. */
  readonly events: number;
}

/**
 * Per-subject replay buffer. Stores up to `maxEvents` per subject
 * with a TTL; thread-safe under the single-writer Node event loop
 * model.
 *
 * @stable
 */
export interface ReplayBuffer {
  push(subject: string, event: ServerEventFrame): void;
  replay(subject: string, sinceEventId: string | undefined): ReplayBufferSlice;
  size(subject: string): number;
  forget(subject: string): void;
  prune(): void;
  /**
   * Occupancy snapshot (W-028). OPTIONAL so external implementations
   * of this `@stable` interface keep compiling; `createReplayBuffer`
   * always provides it. When absent, the `/v1/metrics` replay-buffer
   * gauge degrades to `0`.
   */
  stats?(): ReplayBufferStats;
}

interface BufferedEvent {
  readonly event: ServerEventFrame;
  readonly bufferedAt: number;
}

/**
 * Build an in-memory replay buffer.
 *
 * @stable
 */
export function createReplayBuffer(options: ReplayBufferOptions = {}): ReplayBuffer {
  const maxEvents = options.maxEvents ?? 1_000;
  const ttlMs = options.ttlMs ?? 5 * 60_000;
  const now = options.now ?? Date.now;
  const buffers = new Map<string, BufferedEvent[]>();
  const dropped = new Map<string, number>();

  function pruneSubject(subject: string): void {
    const list = buffers.get(subject);
    if (list === undefined || list.length === 0) return;
    const cutoff = now() - ttlMs;
    let cutoffIndex = 0;
    while (cutoffIndex < list.length) {
      const entry = list[cutoffIndex];
      if (entry === undefined || entry.bufferedAt >= cutoff) break;
      cutoffIndex += 1;
    }
    if (cutoffIndex > 0) {
      list.splice(0, cutoffIndex);
      dropped.set(subject, (dropped.get(subject) ?? 0) + cutoffIndex);
    }
    if (list.length === 0) {
      // W-028: release the whole subject, including its dropped-count
      // entry - otherwise every finished run leaves a Map entry behind
      // forever. A resume with a stale cursor still signals the gap:
      // `replay()` floors droppedCount at 1 when the cursor misses.
      buffers.delete(subject);
      dropped.delete(subject);
    }
  }

  function push(subject: string, event: ServerEventFrame): void {
    pruneSubject(subject);
    let list = buffers.get(subject);
    if (list === undefined) {
      list = [];
      buffers.set(subject, list);
    }
    list.push({ event, bufferedAt: now() });
    if (list.length > maxEvents) {
      const overflow = list.length - maxEvents;
      list.splice(0, overflow);
      dropped.set(subject, (dropped.get(subject) ?? 0) + overflow);
    }
  }

  function replay(subject: string, sinceEventId: string | undefined): ReplayBufferSlice {
    pruneSubject(subject);
    const list = buffers.get(subject) ?? [];
    const droppedCount = dropped.get(subject) ?? 0;
    const last = list.at(-1);
    if (sinceEventId === undefined) {
      const slice: ReplayBufferSlice = {
        events: list.map((entry) => entry.event),
        droppedCount,
        nextEventIdHint: last?.event.eventId,
      };
      return slice;
    }
    const startIndex = list.findIndex((entry) => entry.event.eventId === sinceEventId);
    if (startIndex < 0) {
      // Cursor predates the buffer; return everything we still have +
      // signal the gap via `droppedCount`. The miss itself PROVES at
      // least one event was dropped, so floor the count at 1 even
      // after the dropped-map entry was released by pruning (W-028) -
      // the dispatcher must still send the replay-marker.
      return {
        events: list.map((entry) => entry.event),
        droppedCount: Math.max(droppedCount, 1),
        nextEventIdHint: last?.event.eventId,
      };
    }
    const replayed = list.slice(startIndex + 1).map((entry) => entry.event);
    return {
      events: replayed,
      droppedCount: 0,
      nextEventIdHint: replayed.at(-1)?.eventId,
    };
  }

  return Object.freeze({
    push,
    replay,
    size(subject: string): number {
      pruneSubject(subject);
      return buffers.get(subject)?.length ?? 0;
    },
    forget(subject: string): void {
      buffers.delete(subject);
      dropped.delete(subject);
    },
    prune(): void {
      for (const subject of [...buffers.keys()]) pruneSubject(subject);
    },
    stats(): ReplayBufferStats {
      let events = 0;
      for (const list of buffers.values()) events += list.length;
      return { subjects: buffers.size, events };
    },
  });
}

/**
 * W-028: schedule a periodic {@link ReplayBuffer.prune} sweep. Without
 * it TTL expiry only ran lazily inside `push`/`replay`/`size` FOR THE
 * SAME SUBJECT, so every finished run-subject (a fresh runId per run)
 * retained up to `maxEvents` full payloads forever on a long-living
 * server. Mirrors `scheduleRunPruning` (IP-16): `unref`-ed timer,
 * returns a stop function. The sweep applies only the already
 * documented TTL - replay semantics inside the TTL window are
 * unchanged (an immediate `forget` on run completion would break
 * short-disconnect resume of terminal events).
 *
 * @stable
 */
export function scheduleReplayBufferPruning(
  buffer: ReplayBuffer,
  opts: { readonly intervalMs?: number } = {},
): () => void {
  const intervalMs = opts.intervalMs ?? 60_000;
  const timer = setInterval(() => {
    buffer.prune();
  }, intervalMs);
  if (typeof (timer as { unref?: () => void }).unref === 'function') {
    (timer as { unref: () => void }).unref();
  }
  return () => clearInterval(timer);
}
