import { describe, expect, it } from 'vitest';

import { getCounterForTesting, resetCountersForTesting } from '../src/audit/index.js';
import { createStreamingChannel, type StreamingEvent } from '../src/streaming/index.js';

describe('createStreamingChannel', () => {
  it('forwards progress + partial events into the sink', () => {
    resetCountersForTesting();
    const sink: StreamingEvent[] = [];
    const channel = createStreamingChannel({
      toolName: 'stream-tool',
      toolCallId: 'call-1',
      stepNumber: 2,
      sink: (e) => sink.push(e),
    });
    channel.reportProgress(1, 3);
    channel.streamContent({ kind: 'text', text: 'a' });
    channel.streamContent({ kind: 'text', text: 'b' });
    channel.reportProgress(3, 3);
    expect(sink.map((e) => e.type)).toEqual([
      'tool.execute.progress',
      'tool.execute.partial',
      'tool.execute.partial',
      'tool.execute.progress',
    ]);
    const aggregator = channel.snapshot();
    expect(aggregator.chunkCount).toBe(2);
    expect(aggregator.progressEventCount).toBe(2);
  });

  it('honours streamingHint: false (no events emitted)', () => {
    const sink: StreamingEvent[] = [];
    const channel = createStreamingChannel({
      toolName: 'plain',
      toolCallId: 'call-1',
      stepNumber: 1,
      streamingHint: false,
      sink: (e) => sink.push(e),
    });
    channel.reportProgress(1, 2);
    channel.streamContent({ kind: 'text', text: 'x' });
    expect(sink).toHaveLength(0);
    expect(channel.snapshot().chunkCount).toBe(0);
  });

  it('post-abort calls are no-ops', () => {
    const sink: StreamingEvent[] = [];
    const channel = createStreamingChannel({
      toolName: 'abort',
      toolCallId: 'c',
      stepNumber: 1,
      sink: (e) => sink.push(e),
    });
    channel.streamContent({ kind: 'text', text: 'a' });
    channel.abort('cancelled');
    channel.streamContent({ kind: 'text', text: 'b' });
    channel.reportProgress(1, 2);
    expect(sink).toHaveLength(1);
  });

  it('chunkIndex is monotonically increasing per toolCallId', () => {
    const sink: StreamingEvent[] = [];
    const channel = createStreamingChannel({
      toolName: 't',
      toolCallId: 'c',
      stepNumber: 1,
      sink: (e) => sink.push(e),
    });
    for (let i = 0; i < 5; i++) {
      channel.streamContent({ kind: 'text', text: String(i) });
    }
    const partial = sink.filter((e) => e.type === 'tool.execute.partial');
    const indices = partial.map((e) => (e as { chunkIndex: number }).chunkIndex);
    expect(indices).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('W-117 - bounded aggregation buffer', () => {
  it('past maxBufferBytes chunks keep streaming but stop accumulating (flag + counter)', () => {
    resetCountersForTesting();
    const sink: StreamingEvent[] = [];
    const channel = createStreamingChannel({
      toolName: 'runaway',
      toolCallId: 'call-1',
      stepNumber: 1,
      maxBufferBytes: 10,
      sink: (e) => sink.push(e),
    });
    channel.streamContent({ kind: 'text', text: '12345678' }); // 8 bytes - fits
    channel.streamContent({ kind: 'text', text: 'abcdef' }); // would exceed 10 - dropped
    channel.streamContent({ kind: 'text', text: 'ghijkl' }); // dropped too

    // Subscribers saw every chunk...
    expect(sink.filter((e) => e.type === 'tool.execute.partial')).toHaveLength(3);
    // ...but the assembled body is capped and marked incomplete.
    const snap = channel.snapshot();
    expect(snap.chunkCount).toBe(1);
    expect(snap.totalBytes).toBe(8);
    expect(snap.chunks.map((c) => (c.kind === 'text' ? c.text : ''))).toEqual(['12345678']);
    expect(snap.bufferTruncated).toBe(true);
    expect(
      getCounterForTesting('tool.streaming.buffer.dropped-bytes.total', {
        toolName: 'runaway',
        kind: 'text',
      }),
    ).toBe(12);
  });

  it('without a cap the buffer stays lossless and bufferTruncated stays false', () => {
    resetCountersForTesting();
    const channel = createStreamingChannel({
      toolName: 'normal',
      toolCallId: 'call-1',
      stepNumber: 1,
    });
    channel.streamContent({ kind: 'text', text: 'a'.repeat(1024) });
    channel.streamContent({ kind: 'text', text: 'b'.repeat(1024) });
    const snap = channel.snapshot();
    expect(snap.chunkCount).toBe(2);
    expect(snap.totalBytes).toBe(2048);
    expect(snap.bufferTruncated).toBe(false);
    expect(
      getCounterForTesting('tool.streaming.buffer.dropped-bytes.total', {
        toolName: 'normal',
        kind: 'text',
      }),
    ).toBe(0);
  });
});
