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

/** Configuration for {@link createStreamingChannel}. */
export interface StreamingChannelOptions {
  readonly toolName: string;
  readonly toolCallId: string;
  readonly stepNumber: number;
  /** Max in-flight events kept in the per-channel buffer. Default `256`. */
  readonly eventQueueDepth?: number;
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
  const streamingHint = opts.streamingHint ?? true;
  const sink = opts.sink;
  const now = opts.now ?? (() => Date.now());

  const chunks: ContentChunk[] = [];
  let chunkCount = 0;
  let chunkIndex = 0;
  let progressEventCount = 0;
  let totalBytes = 0;
  let aborted = false;
  let inFlight = 0;
  const startedAt = now();
  let firstChunkRecorded = false;

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
      incrementCounter('tool.streaming.events.dropped.total', {
        toolName: opts.toolName,
        reason: 'backpressure',
      });
      // The aggregated buffer is unaffected — append regardless.
      chunks.push(chunk);
      chunkCount++;
      addBytes(chunk);
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
    chunks.push(chunk);
    chunkCount++;
    addBytes(chunk);
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
    });
  }

  function addBytes(chunk: ContentChunk): void {
    totalBytes += chunkBytes(chunk);
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
