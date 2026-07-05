/**
 * Graphorin v0.6.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/document-pipeline`. Every assertion
 * runs against the real `InMemoryCheckpointStore` shipped by
 * `@graphorin/workflow` so concurrency + channel semantics are
 * exercised end-to-end:
 *
 *  1. `VERSION` mirrors `package.json` (`0.6.0`).
 *  2. A 4-page synthetic document drives the pipeline to `completed`
 *     with chunks, embeddings, all 4 page summaries, the index
 *     timestamp, and a populated `parserNotice` — and the per-channel
 *     update count covers every channel actively written by the run.
 *  3. The exported `DOCUMENT_CHANNELS` record exercises every channel
 *     kind defined by `@graphorin/core` — `latest-value`, `reducer`,
 *     `stream`, `barrier`, `ephemeral`, `any-value` — and every
 *     `kind` discriminator surfaces at least once.
 *  4. `Dispatch` parallelism is observable: collecting the run with
 *     `stream: 'tasks'` produces multiple `workflow.task.start` events
 *     for the `chunk` node within a single execution step.
 *  5. The deterministic stub embedder produces the documented 8-dim
 *     L2-normalised vector.
 */

import type { Channel, WorkflowEvent } from '@graphorin/core';
import { InMemoryCheckpointStore } from '@graphorin/workflow';
import { describe, expect, it } from 'vitest';
import { embed, STUB_EMBEDDING_DIM } from '../src/embedder-stub.js';
import {
  buildSyntheticDocument,
  createDocumentPipeline,
  DOCUMENT_CHANNELS,
  runDocumentPipelineDemo,
  VERSION,
} from '../src/main.js';
import { CHANNEL_NAMES, type DocumentState, NODE_NAMES } from '../src/types.js';

const REQUIRED_CHANNEL_KINDS: ReadonlyArray<Channel['kind']> = [
  'latest-value',
  'reducer',
  'stream',
  'barrier',
  'ephemeral',
  'any-value',
];

function pages(): ReturnType<typeof buildSyntheticDocument> {
  return buildSyntheticDocument(4);
}

describe('examples/document-pipeline — smoke', () => {
  it('exposes VERSION = 0.6.0', () => {
    expect(VERSION).toBe('0.6.0');
  });

  it('runs the 4-page pipeline end-to-end with all expected state populated', async () => {
    const store = new InMemoryCheckpointStore();
    const result = await runDocumentPipelineDemo({
      pages: pages(),
      checkpointStore: store,
      threadId: 'doc-smoke-4',
    });

    expect(result.status).toBe('completed');
    expect(result.finalState.chunks.length).toBeGreaterThan(0);
    expect(result.finalState.embeddings.length).toBeGreaterThan(0);
    expect(result.finalState.embeddings.length).toBe(result.finalState.chunks.length);
    expect(Object.keys(result.finalState.pageSummaries)).toHaveLength(4);
    expect(result.finalState.indexedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(result.finalState.parserNotice).toBeDefined();
    expect(result.finalState.parserNotice ?? '').toMatch(/observed/);

    expect(result.finalState.transientLog).toBeUndefined();

    expect(result.channelEvents[CHANNEL_NAMES.chunks] ?? 0).toBeGreaterThan(0);
    expect(result.channelEvents[CHANNEL_NAMES.embeddings] ?? 0).toBeGreaterThan(0);
    expect(result.channelEvents[CHANNEL_NAMES.pageSummaries] ?? 0).toBeGreaterThan(0);
    expect(result.channelEvents[CHANNEL_NAMES.parserNotice] ?? 0).toBeGreaterThan(0);
    expect(result.channelEvents[CHANNEL_NAMES.transientLog] ?? 0).toBeGreaterThan(0);
    expect(result.channelEvents[CHANNEL_NAMES.gate] ?? 0).toBeGreaterThan(0);
    expect(result.channelEvents[CHANNEL_NAMES.indexedAt] ?? 0).toBeGreaterThan(0);

    const lastEvent = result.events[result.events.length - 1];
    expect(lastEvent?.type).toBe('workflow.end');
  });

  it('declares every channel kind defined by @graphorin/core', () => {
    const expected: Readonly<Record<keyof DocumentState, Channel['kind']>> = {
      pages: 'latest-value',
      chunks: 'stream',
      embeddings: 'reducer',
      pageSummaries: 'latest-value',
      parserNotice: 'any-value',
      transientLog: 'ephemeral',
      gate: 'barrier',
      indexedAt: 'latest-value',
    };
    for (const [field, kind] of Object.entries(expected)) {
      const channel = DOCUMENT_CHANNELS[field as keyof DocumentState];
      expect(channel.kind, `channel '${field}' must declare kind '${kind}'`).toBe(kind);
    }
    const seenKinds = new Set<Channel['kind']>(Object.values(DOCUMENT_CHANNELS).map((c) => c.kind));
    for (const required of REQUIRED_CHANNEL_KINDS) {
      expect(seenKinds.has(required), `channel kind '${required}' must be exercised`).toBe(true);
    }
  });

  it('exposes all eight node names on the constructed Workflow', () => {
    const wf = createDocumentPipeline({ checkpointStore: new InMemoryCheckpointStore() });
    expect(new Set(wf.nodeNames)).toEqual(
      new Set([
        NODE_NAMES.parse,
        NODE_NAMES.chunk,
        NODE_NAMES.embed,
        NODE_NAMES.summarize,
        NODE_NAMES.metadata,
        NODE_NAMES.transient,
        NODE_NAMES.barrier,
        NODE_NAMES.index,
      ]),
    );
  });

  it('Dispatch fans out the chunk node into multiple parallel tasks within one step', async () => {
    const wf = createDocumentPipeline({ checkpointStore: new InMemoryCheckpointStore() });
    const events: WorkflowEvent<DocumentState>[] = [];
    for await (const ev of wf.execute(
      { pages: pages() },
      { threadId: 'doc-smoke-dispatch', stream: 'tasks' },
    )) {
      events.push(ev);
    }

    const chunkStarts = events.filter(
      (e): e is Extract<WorkflowEvent<DocumentState>, { type: 'workflow.task.start' }> =>
        e.type === 'workflow.task.start' && e.nodeName === NODE_NAMES.chunk,
    );
    expect(chunkStarts.length).toBeGreaterThanOrEqual(2);

    const stepGroups = new Map<number, number>();
    for (const ev of chunkStarts) {
      stepGroups.set(ev.stepNumber, (stepGroups.get(ev.stepNumber) ?? 0) + 1);
    }
    const maxParallel = Math.max(...stepGroups.values());
    expect(maxParallel).toBeGreaterThanOrEqual(2);

    const lastEvent = events[events.length - 1];
    expect(lastEvent?.type).toBe('workflow.end');
  });

  it('stub embedder returns a deterministic 8-dim L2-normalised vector', () => {
    const v = embed('hello graphorin');
    expect(v).toHaveLength(STUB_EMBEDDING_DIM);
    const norm = Math.sqrt(v.reduce((acc, x) => acc + x * x, 0));
    expect(norm).toBeGreaterThan(0.99);
    expect(norm).toBeLessThan(1.01);
    const v2 = embed('hello graphorin');
    expect(Array.from(v2)).toEqual(Array.from(v));
  });
});
