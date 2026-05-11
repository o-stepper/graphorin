/**
 * Coverage for the internal SSE + ndjson stream parsers shared by the
 * three OpenAI-shape adapters. The tests build hand-rolled
 * `ReadableStream<Uint8Array>` bodies with awkward chunk boundaries to
 * exercise the buffering logic directly.
 */
import { describe, expect, it } from 'vitest';

import { parseEventStream, parseNdJsonStream } from '../../src/internal/sse.js';

function streamFrom(chunks: ReadonlyArray<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      const chunk = chunks[i++];
      if (chunk !== undefined) controller.enqueue(encoder.encode(chunk));
    },
  });
}

async function collect(it: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const v of it) out.push(v);
  return out;
}

describe('parseEventStream', () => {
  it('returns immediately when body is null', async () => {
    const out = await collect(parseEventStream(null));
    expect(out).toEqual([]);
  });

  it('yields one payload per data: line and terminates on [DONE]', async () => {
    const body = streamFrom([
      'data: {"a":1}\n\n',
      'data: {"a":2}\n\n',
      'data: [DONE]\n\n',
      'data: {"a":3}\n\n',
    ]);
    const out = await collect(parseEventStream(body));
    expect(out).toEqual(['{"a":1}', '{"a":2}']);
  });

  it('reassembles payloads split across pull boundaries', async () => {
    const body = streamFrom(['data: {"hel', 'lo":', '"world"}', '\n\n', 'data: [DONE]\n\n']);
    const out = await collect(parseEventStream(body));
    expect(out).toEqual(['{"hello":"world"}']);
  });

  it('handles CRLF separators alongside LF', async () => {
    const body = streamFrom(['data: {"a":1}\r\n\r\n', 'data: {"a":2}\n\n']);
    const out = await collect(parseEventStream(body));
    expect(out).toEqual(['{"a":1}', '{"a":2}']);
  });

  it('joins multi-line data: blocks with a newline', async () => {
    const body = streamFrom(['data: line1\ndata: line2\n\n']);
    const out = await collect(parseEventStream(body));
    expect(out).toEqual(['line1\nline2']);
  });

  it('skips comment lines (": ping") and event:/id: metadata', async () => {
    const body = streamFrom([': keepalive\n\n', 'event: open\n\n', 'data: payload\n\n']);
    const out = await collect(parseEventStream(body));
    expect(out).toEqual(['payload']);
  });

  it('emits a trailing payload when the stream ends without a separator', async () => {
    const body = streamFrom(['data: tail-payload']);
    const out = await collect(parseEventStream(body));
    expect(out).toEqual(['tail-payload']);
  });

  it('respects a pre-aborted signal by returning no events', async () => {
    const ac = new AbortController();
    ac.abort();
    const body = streamFrom(['data: x\n\n']);
    const out = await collect(parseEventStream(body, { signal: ac.signal }));
    expect(out).toEqual([]);
  });
});

describe('parseNdJsonStream', () => {
  it('returns immediately when body is null', async () => {
    const out = await collect(parseNdJsonStream(null));
    expect(out).toEqual([]);
  });

  it('yields one trimmed line per newline-separated JSON object', async () => {
    const body = streamFrom(['{"a":1}\n', '{"a":2}\n']);
    const out = await collect(parseNdJsonStream(body));
    expect(out).toEqual(['{"a":1}', '{"a":2}']);
  });

  it('reassembles lines split across pulls', async () => {
    const body = streamFrom(['{"a"', ':1}\n{"b":', '2}\n']);
    const out = await collect(parseNdJsonStream(body));
    expect(out).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('emits the trailing tail when the stream ends without a newline', async () => {
    const body = streamFrom(['{"a":1}']);
    const out = await collect(parseNdJsonStream(body));
    expect(out).toEqual(['{"a":1}']);
  });

  it('skips empty lines', async () => {
    const body = streamFrom(['\n', '{"a":1}\n', '\n', '{"b":2}\n']);
    const out = await collect(parseNdJsonStream(body));
    expect(out).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('respects a pre-aborted signal by returning no lines', async () => {
    const ac = new AbortController();
    ac.abort();
    const body = streamFrom(['{"a":1}\n']);
    const out = await collect(parseNdJsonStream(body, { signal: ac.signal }));
    expect(out).toEqual([]);
  });
});
