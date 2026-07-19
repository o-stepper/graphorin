/**
 * Per-`toolCallId` streaming channel.
 *
 * The {@link StreamingChannel} is the back-pressure-aware fan-out
 * surface the executor wires into a streaming-hint tool's
 * `ctx.reportProgress(...)` and `ctx.streamContent(...)` calls.
 * Subscribers (the agent runtime's `agent.stream(...)` consumers) read
 * from `events()`.
 *
 * The channel maintains a per-tool-call aggregation buffer that
 * concatenates streamed chunks into the canonical assembled `output`.
 * The buffer-becomes-output discipline is preserved bytes-equal across
 * graceful completion, cancellation (drain mode), and abrupt abort.
 *
 * @packageDocumentation
 */

import type {
  ContentChunk,
  ToolExecutePartialEvent,
  ToolExecuteProgressEvent,
} from '@graphorin/core';

import { incrementCounter, observeHistogram } from '../audit/index.js';

/** Discriminated union of streaming events the channel forwards. */
export type StreamingEvent = ToolExecuteProgressEvent | ToolExecutePartialEvent;

/**
 * Default byte cap on the per-call aggregation buffer. Generous -
 * an ordinary tool result is orders of magnitude smaller; the cap exists
 * so an unbounded streaming producer cannot exhaust host memory.
 *
 * @stable
 */
export const DEFAULT_MAX_BUFFER_BYTES = 8 * 1024 * 1024;

/** Configuration for {@link createStreamingChannel}. */
export interface StreamingChannelOptions {
  readonly toolName: string;
  readonly toolCallId: string;
  readonly stepNumber: number;
  /**
   * Re-entrancy guard depth for the SYNCHRONOUS sink delivery. Delivery
   * is not a queue: each event is handed to the sink inline and
   * `inFlight` only exceeds 1 when the sink itself re-enters the
   * channel - in which case the CURRENT (newest) event is dropped and
   * counted. Default `256`.
   */
  readonly eventQueueDepth?: number;
  /**
   * Byte cap on the in-memory aggregation buffer (the
   * buffer-becomes-output `chunks`). Past the cap, chunks still DELIVER
   * to the sink (subscribers keep streaming) but stop accumulating, the
   * dropped bytes are counted (`tool.streaming.buffer.dropped-bytes.total`)
   * and {@link StreamingAggregator.bufferTruncated} flips so the
   * envelope / spill path can mark the assembled body incomplete.
   * Default 8 MiB.
   */
  readonly maxBufferBytes?: number;
  /**
   * Optional streaming-hint flag. When `false` the channel turns
   * `report` / `content` into no-ops; the executor still reads the
   * empty assembled buffer at the end so the buffer-becomes-output
   * discipline degrades gracefully.
   *
   * @default `true`
   */
  readonly streamingHint?: boolean;
  /**
   * Optional sink invoked for every streaming event. The agent
   * runtime injects a sink that re-emits into `agent.stream(...)`.
   * Tests pass a fixture sink to assert event ordering.
   */
  readonly sink?: (event: StreamingEvent) => void;
  /** Wall clock for tests. Defaults to `Date.now`. */
  readonly now?: () => number;
}

/**
 * Aggregated chunks the executor reads after the tool returns. The
 * `chunks` array is the source of truth for the buffer-becomes-output
 * discipline; the executor passes it to `toResultEnvelope({ chunks })`.
 *
 * @stable
 */
export interface StreamingAggregator {
  readonly chunks: ReadonlyArray<ContentChunk>;
  readonly chunkCount: number;
  readonly progressEventCount: number;
  readonly totalBytes: number;
  /**
   * `true` when the aggregation buffer hit `maxBufferBytes` and
   * later chunks were dropped from the ASSEMBLED body (sink delivery
   * continued). Consumers building an output / spill artifact from
   * `chunks` must treat the body as incomplete.
   */
  readonly bufferTruncated: boolean;
}

/**
 * Public channel surface. Implementations are returned by
 * {@link createStreamingChannel}.
 *
 * @stable
 */
export interface StreamingChannel {
  /** Emit a progress event into the channel. */
  reportProgress(current: number, total?: number, message?: string): void;
  /** Emit a content chunk into the channel. */
  streamContent(chunk: ContentChunk): void;
  /** Mark the channel cancelled (post-cancellation calls are no-ops). */
  abort(reason: 'cancelled' | 'finished'): void;
  /** Snapshot the aggregated buffer. */
  snapshot(): StreamingAggregator;
}

/**
 * Build a {@link StreamingChannel} for one tool execution.
 *
 * @stable
 */
export function createStreamingChannel(opts: StreamingChannelOptions): StreamingChannel {
  const eventQueueDepth = opts.eventQueueDepth ?? 256;
  const maxBufferBytes = opts.maxBufferBytes ?? DEFAULT_MAX_BUFFER_BYTES;
  const streamingHint = opts.streamingHint ?? true;
  const sink = opts.sink;
  const now = opts.now ?? (() => Date.now());

  const chunks: ContentChunk[] = [];
  let chunkCount = 0;
  let chunkIndex = 0;
  let progressEventCount = 0;
  let totalBytes = 0;
  let bufferTruncated = false;
  let aborted = false;
  let inFlight = 0;
  const startedAt = now();
  let firstChunkRecorded = false;

  // W-117: bound the in-memory aggregation buffer. A capped-out chunk
  // still delivers to the sink (subscribers keep streaming); it just
  // stops accumulating, so a runaway streaming tool cannot grow host
  // memory without bound. Surfaced via snapshot().bufferTruncated.
  function appendToBuffer(chunk: ContentChunk): void {
    const size = chunkBytes(chunk);
    if (totalBytes + size > maxBufferBytes) {
      bufferTruncated = true;
      incrementCounter(
        'tool.streaming.buffer.dropped-bytes.total',
        { toolName: opts.toolName, kind: chunk.kind },
        size,
      );
      return;
    }
    chunks.push(chunk);
    chunkCount++;
    totalBytes += size;
  }

  function reportProgress(current: number, total?: number, message?: string): void {
    if (!streamingHint || aborted) return;
    if (inFlight >= eventQueueDepth) {
      incrementCounter('tool.streaming.events.dropped.total', {
        toolName: opts.toolName,
        reason: 'backpressure',
      });
      return;
    }
    recordFirstChunk();
    const event: ToolExecuteProgressEvent = {
      type: 'tool.execute.progress',
      toolName: opts.toolName,
      toolCallId: opts.toolCallId,
      current,
      ...(total !== undefined ? { total } : {}),
      ...(message !== undefined ? { message } : {}),
      stepNumber: opts.stepNumber,
      ts: now(),
    };
    progressEventCount++;
    incrementCounter('tool.streaming.events.emitted.total', {
      toolName: opts.toolName,
      kind: 'progress',
    });
    deliver(event);
  }

  function streamContent(chunk: ContentChunk): void {
    if (!streamingHint || aborted) return;
    recordFirstChunk();
    if (inFlight >= eventQueueDepth) {
      // Honest semantics (W-117): delivery is synchronous, so this
      // guard only trips on sink RE-ENTRANCY, and it is the current
      // (newest) event that is dropped - there is no queue to shed
      // older entries from.
      incrementCounter('tool.streaming.events.dropped.total', {
        toolName: opts.toolName,
        reason: 'backpressure',
      });
      // The aggregated buffer is unaffected by event drops - append
      // (still subject to the byte cap).
      appendToBuffer(chunk);
      return;
    }
    const event: ToolExecutePartialEvent = {
      type: 'tool.execute.partial',
      toolName: opts.toolName,
      toolCallId: opts.toolCallId,
      chunk,
      chunkIndex: chunkIndex++,
      stepNumber: opts.stepNumber,
      ts: now(),
    };
    appendToBuffer(chunk);
    incrementCounter('tool.streaming.events.emitted.total', {
      toolName: opts.toolName,
      kind: chunkKindLabel(chunk),
    });
    incrementCounter(
      'tool.streaming.chunks.bytes.total',
      {
        toolName: opts.toolName,
        kind: chunk.kind,
      },
      chunkBytes(chunk),
    );
    deliver(event);
  }

  function abort(reason: 'cancelled' | 'finished'): void {
    if (aborted) return;
    aborted = true;
    if (reason === 'cancelled') {
      incrementCounter('tool.streaming.events.dropped.total', {
        toolName: opts.toolName,
        reason: 'cancelled',
      });
    }
    if (firstChunkRecorded || progressEventCount > 0 || chunkCount > 0) {
      observeHistogram('tool.streaming.duration_ms', now() - startedAt, {
        toolName: opts.toolName,
      });
    }
  }

  function recordFirstChunk(): void {
    if (firstChunkRecorded) return;
    firstChunkRecorded = true;
    observeHistogram('tool.streaming.first-chunk.duration_ms', now() - startedAt, {
      toolName: opts.toolName,
    });
  }

  function snapshot(): StreamingAggregator {
    return Object.freeze({
      chunks: Object.freeze([...chunks]),
      chunkCount,
      progressEventCount,
      totalBytes,
      bufferTruncated,
    });
  }

  function deliver(event: StreamingEvent): void {
    if (sink === undefined) return;
    inFlight++;
    try {
      sink(event);
    } finally {
      inFlight = Math.max(0, inFlight - 1);
    }
    observeHistogram('tool.streaming.event-deliver.duration_us', 0, {
      toolName: opts.toolName,
    });
  }

  return { reportProgress, streamContent, abort, snapshot };
}

function chunkKindLabel(chunk: ContentChunk): string {
  switch (chunk.kind) {
    case 'text':
      return 'partial-text';
    case 'json-delta':
      return 'partial-json-delta';
    case 'image':
      return 'partial-image';
  }
}

function chunkBytes(chunk: ContentChunk): number {
  switch (chunk.kind) {
    case 'text':
      return chunk.text.length;
    case 'json-delta':
      try {
        return JSON.stringify(chunk.value).length + chunk.path.length;
      } catch {
        return chunk.path.length;
      }
    case 'image':
      return chunk.data.byteLength;
  }
}
