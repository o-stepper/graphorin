/**
 * Graphorin v0.5.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Workflow concurrency acceptance demo — library mode. Wires
 * `@graphorin/workflow`'s step-graph engine to an eight-node document
 * ingestion pipeline (`parse` → fan-out `chunk` × N → `embed-chunks` +
 * `summarize-page` → `barrier` → `index`, with side nodes
 * `metadata-collector` and `transient-event`) that exercises every
 * channel kind shipped by `@graphorin/core` (`LatestValue`, `Reducer`,
 * `Stream`, `Barrier`, `Ephemeral`, `AnyValue`) and the dynamic
 * task primitive `Dispatch` end-to-end.
 *
 * Exports `DOCUMENT_CHANNELS` (the typed channel record consumed by the
 * factory + asserted on by the smoke test), `createDocumentPipeline(...)`
 * (the typed `Workflow` factory), and `runDocumentPipelineDemo(...)`
 * (executes a single document and returns the collected event stream,
 * the final state, and a per-channel update count). The CLI entry
 * point exercises a 4-page synthetic document end-to-end and prints a
 * one-line summary.
 */

import process from 'node:process';
import { type CheckpointStore, collect, dispatch, type WorkflowEvent } from '@graphorin/core';
import { optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import {
  anyValue,
  barrier,
  type Channel,
  createNode,
  createWorkflow,
  ephemeral,
  InMemoryCheckpointStore,
  latestValue,
  reducer,
  type StreamMode,
  stream,
  type Workflow,
} from '@graphorin/workflow';
import { embed } from './embedder-stub.js';
import {
  CHUNKS_PER_PAGE,
  type DocumentChunk,
  type DocumentEmbedding,
  type DocumentInput,
  type DocumentPage,
  type DocumentState,
  GATE_FIRED,
  type GateState,
  NODE_NAMES,
} from './types.js';

/** Canonical version constant — must mirror `package.json`. */
export const VERSION = '0.5.0';

/** Default stream mode used by the demo helper unless explicitly overridden. */
const DEFAULT_STREAM_MODE: StreamMode = 'debug';

/**
 * Typed channel record handed to {@link createDocumentPipeline}. Exposed
 * as a top-level binding so the smoke test can inspect each entry's
 * `kind` discriminator and assert the full `LatestValue / Reducer /
 * Stream / Barrier / Ephemeral / AnyValue` matrix is covered.
 */
export const DOCUMENT_CHANNELS: Readonly<{
  [K in keyof DocumentState]-?: Channel<DocumentState[K]>;
}> = Object.freeze({
  pages: latestValue<ReadonlyArray<DocumentPage>>({ default: [] }),
  chunks: stream<ReadonlyArray<DocumentChunk>>({ default: [] }),
  embeddings: reducer<ReadonlyArray<DocumentEmbedding>>((prev, next) => [...prev, ...next], {
    default: [],
  }),
  pageSummaries: latestValue<Readonly<Record<number, string>>>({ default: {} }),
  parserNotice: anyValue<DocumentState['parserNotice']>(),
  transientLog: ephemeral<DocumentState['transientLog']>(),
  gate: barrier<GateState>([NODE_NAMES.embed, NODE_NAMES.summarize], {
    default: {} as GateState,
  }),
  indexedAt: latestValue<DocumentState['indexedAt']>(),
});

/** Inputs accepted by {@link createDocumentPipeline}. */
export interface CreateDocumentPipelineOptions {
  readonly checkpointStore: CheckpointStore;
}

/**
 * Build the eight-node document pipeline. Always returns a fresh
 * `Workflow` instance bound to the supplied {@link CheckpointStore};
 * pair the same store argument across multiple calls if persistence is
 * desired (the example defaults to an in-memory store because
 * concurrency, not durability, is the focus).
 */
export function createDocumentPipeline(
  options: CreateDocumentPipelineOptions,
): Workflow<DocumentState, DocumentInput> {
  const tracer = optionalTracerFromEnv(process.env);
  return createWorkflow<DocumentState, DocumentInput>({
    name: 'document-pipeline',
    channels: DOCUMENT_CHANNELS,
    nodes: {
      [NODE_NAMES.parse]: createNode<DocumentState>({
        name: NODE_NAMES.parse,
        run: (state, ctx) => {
          ctx.emit('parse.started', { pageCount: state.pages.length });
          const dispatches = state.pages.map((page) =>
            dispatch<{ readonly page: DocumentPage }>(NODE_NAMES.chunk, { page }),
          );
          const writes: Partial<DocumentState> = {
            parserNotice: `parser observed ${state.pages.length} page(s)`,
            transientLog: `parse:start pages=${state.pages.length}`,
          };
          return [...dispatches, writes];
        },
      }),
      [NODE_NAMES.chunk]: createNode<DocumentState>({
        name: NODE_NAMES.chunk,
        run: (_state, ctx) => {
          const args = ctx.dispatchArgs as { readonly page: DocumentPage } | undefined;
          if (!args) {
            throw new Error('chunk node requires dispatchArgs.page');
          }
          const { page } = args;
          const chunks = splitPageIntoChunks(page);
          ctx.emit('chunk.produced', { pageNumber: page.pageNumber, count: chunks.length });
          return { chunks } satisfies Partial<DocumentState>;
        },
      }),
      [NODE_NAMES.embed]: createNode<DocumentState>({
        name: NODE_NAMES.embed,
        run: (state, ctx) => {
          const newEmbeddings: DocumentEmbedding[] = state.chunks.map((c) => ({
            pageNumber: c.pageNumber,
            section: c.section,
            vector: embed(c.text),
          }));
          ctx.emit('embed.completed', { vectors: newEmbeddings.length });
          return {
            embeddings: newEmbeddings,
            gate: GATE_FIRED,
          } satisfies Partial<DocumentState>;
        },
      }),
      [NODE_NAMES.summarize]: createNode<DocumentState>({
        name: NODE_NAMES.summarize,
        run: (state, ctx) => {
          const summaries: Record<number, string> = {};
          for (const chunk of state.chunks) {
            const existing = summaries[chunk.pageNumber] ?? '';
            const next = existing.length === 0 ? chunk.text : `${existing} ${chunk.text}`;
            summaries[chunk.pageNumber] = clamp(next, 96);
          }
          ctx.emit('summarize.completed', { pages: Object.keys(summaries).length });
          return {
            pageSummaries: summaries,
            gate: GATE_FIRED,
          } satisfies Partial<DocumentState>;
        },
      }),
      [NODE_NAMES.metadata]: createNode<DocumentState>({
        name: NODE_NAMES.metadata,
        run: (state, ctx) => {
          ctx.emit('metadata.collected', { pages: state.pages.length });
          return {
            parserNotice: `metadata-collector observed ${state.pages.length} page(s)`,
          } satisfies Partial<DocumentState>;
        },
      }),
      [NODE_NAMES.transient]: createNode<DocumentState>({
        name: NODE_NAMES.transient,
        run: (_state, ctx) => {
          const tag = `transient-event:observed step=${ctx.stepNumber}`;
          ctx.emit('transient.observed', { tag });
          return { transientLog: tag } satisfies Partial<DocumentState>;
        },
      }),
      [NODE_NAMES.barrier]: createNode<DocumentState>({
        name: NODE_NAMES.barrier,
        run: (state, ctx) => {
          const ready = Object.keys(state.gate);
          ctx.emit('barrier.ready', { writers: ready });
          return undefined;
        },
      }),
      [NODE_NAMES.index]: createNode<DocumentState>({
        name: NODE_NAMES.index,
        run: (state, ctx) => {
          const indexedAt = new Date().toISOString();
          ctx.emit('index.completed', {
            chunks: state.chunks.length,
            embeddings: state.embeddings.length,
            indexedAt,
          });
          return { indexedAt } satisfies Partial<DocumentState>;
        },
      }),
    },
    edges: [
      { from: '__start__', to: NODE_NAMES.parse },
      { from: NODE_NAMES.parse, to: NODE_NAMES.metadata },
      { from: NODE_NAMES.parse, to: NODE_NAMES.transient },
      { from: NODE_NAMES.chunk, to: NODE_NAMES.embed },
      { from: NODE_NAMES.chunk, to: NODE_NAMES.summarize },
      { from: NODE_NAMES.embed, to: NODE_NAMES.barrier },
      { from: NODE_NAMES.summarize, to: NODE_NAMES.barrier },
      { from: NODE_NAMES.barrier, to: NODE_NAMES.index },
      { from: NODE_NAMES.index, to: '__end__' },
      { from: NODE_NAMES.metadata, to: '__end__' },
      { from: NODE_NAMES.transient, to: '__end__' },
    ],
    checkpointStore: options.checkpointStore,
    ...(tracer !== undefined ? { tracer } : {}),
  });
}

/** Inputs accepted by {@link runDocumentPipelineDemo}. */
export interface RunDocumentPipelineDemoOptions {
  readonly pages: ReadonlyArray<DocumentPage>;
  readonly checkpointStore: CheckpointStore;
  readonly threadId?: string;
  /** Stream emission mode — defaults to `'debug'` (every event kind). */
  readonly stream?: StreamMode;
  readonly signal?: AbortSignal;
}

/** Result returned by {@link runDocumentPipelineDemo}. */
export interface RunDocumentPipelineDemoResult {
  readonly threadId: string;
  readonly events: ReadonlyArray<WorkflowEvent<DocumentState>>;
  readonly finalState: DocumentState;
  readonly channelEvents: Readonly<Record<string, number>>;
  readonly status: 'completed' | 'suspended' | 'running' | 'failed' | 'aborted';
}

/**
 * Drive the document pipeline through a single end-to-end run and
 * return the collected event stream, the latest checkpointed state,
 * and a per-channel `workflow.channel.update` event count derived from
 * the stream.
 */
export async function runDocumentPipelineDemo(
  options: RunDocumentPipelineDemoOptions,
): Promise<RunDocumentPipelineDemoResult> {
  const wf = createDocumentPipeline({ checkpointStore: options.checkpointStore });
  const threadId = options.threadId ?? `doc-${Date.now().toString(36)}`;
  const events = (await collect(
    wf.execute(
      { pages: options.pages },
      {
        threadId,
        stream: options.stream ?? DEFAULT_STREAM_MODE,
        ...(options.signal !== undefined ? { signal: options.signal } : {}),
      },
    ),
  )) as ReadonlyArray<WorkflowEvent<DocumentState>>;

  const channelEvents: Record<string, number> = {};
  for (const ev of events) {
    if (ev.type === 'workflow.channel.update') {
      channelEvents[ev.channel] = (channelEvents[ev.channel] ?? 0) + 1;
    }
  }

  const snapshot = await wf.getState(threadId);
  return {
    threadId,
    events,
    finalState: snapshot.state,
    channelEvents: Object.freeze(channelEvents),
    status: snapshot.status,
  };
}

/** Synthesize a deterministic N-page document for the CLI / smoke test. */
export function buildSyntheticDocument(pageCount: number): ReadonlyArray<DocumentPage> {
  const pages: DocumentPage[] = [];
  for (let i = 1; i <= pageCount; i += 1) {
    const text =
      `page ${i}: graphorin pipeline exercises every channel type. ` +
      `lorem ipsum payload for embedding stability. section a / section b.`;
    pages.push({ pageNumber: i, text });
  }
  return Object.freeze(pages);
}

/**
 * CLI entry point. Builds a synthetic 4-page document, runs the
 * pipeline against an `InMemoryCheckpointStore`, and prints a
 * one-line summary.
 */
export async function main(): Promise<number> {
  const pages = buildSyntheticDocument(4);
  const result = await runDocumentPipelineDemo({
    pages,
    checkpointStore: new InMemoryCheckpointStore(),
    threadId: 'demo-doc-4',
  });
  process.stdout.write(
    `graphorin v${VERSION} document-pipeline — ` +
      `status=${result.status}, pages=${pages.length}, ` +
      `chunks=${result.finalState.chunks.length}, ` +
      `embeddings=${result.finalState.embeddings.length}, ` +
      `summaries=${Object.keys(result.finalState.pageSummaries).length}, ` +
      `parserNotice='${result.finalState.parserNotice ?? '<none>'}', ` +
      `indexedAt='${result.finalState.indexedAt ?? '<none>'}'.\n`,
  );
  return result.status === 'completed' ? 0 : 1;
}

function splitPageIntoChunks(page: DocumentPage): DocumentChunk[] {
  const sectionLen = Math.max(1, Math.ceil(page.text.length / CHUNKS_PER_PAGE));
  const chunks: DocumentChunk[] = [];
  for (let i = 0; i < CHUNKS_PER_PAGE; i += 1) {
    const start = i * sectionLen;
    const text = page.text.slice(start, start + sectionLen);
    if (text.length === 0) continue;
    chunks.push({ pageNumber: page.pageNumber, section: i, text });
  }
  return chunks;
}

function clamp(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
