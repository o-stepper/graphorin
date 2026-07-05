/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Public types for the `document-pipeline` example. Captures the
 * synthetic PDF input shape, the `DocumentState` carried across every
 * checkpoint, the chunk + embedding records produced along the way,
 * the canonical node-name and channel-name constants the workflow
 * factory references, and the `GateState` brand that lets the typed
 * `Barrier` channel `gate` accept per-node writes without leaking
 * `any` into the public surface.
 */

/** Synthetic page handed to the pipeline as input. */
export interface DocumentPage {
  readonly pageNumber: number;
  readonly text: string;
}

/** Input contract accepted by `runDocumentPipelineDemo(...)`. */
export interface DocumentInput {
  readonly pages: ReadonlyArray<DocumentPage>;
}

/**
 * One unit of work produced by the `chunk` node. The example splits
 * each page into fixed-size sections so a four-page document fans out
 * to a deterministic number of chunks.
 */
export interface DocumentChunk {
  readonly pageNumber: number;
  readonly section: number;
  readonly text: string;
}

/** Embedding emitted by the deterministic stub `embed(...)` helper. */
export interface DocumentEmbedding {
  readonly pageNumber: number;
  readonly section: number;
  readonly vector: ReadonlyArray<number>;
}

/**
 * Brand applied to the per-node value written to the `gate` `Barrier`
 * channel. The runtime stores writes under the writer's `nodeName`, so
 * the channel's merged value is `Record<nodeName, GateState>` - the
 * type alias keeps the cast site narrow without resorting to `any`.
 */
export type GateState = Readonly<Record<string, true>>;

/**
 * Workflow state shape carried across every checkpoint. `pages` is the
 * input mirror; `chunks`, `embeddings`, `pageSummaries`, `parserNotice`,
 * `transientLog`, `gate`, and `indexedAt` are populated by the
 * pipeline. Each field is bound to a different channel kind so the
 * smoke test exercises the full `LatestValue / Reducer / Stream /
 * Barrier / Ephemeral / AnyValue` matrix end-to-end.
 */
export interface DocumentState {
  pages: ReadonlyArray<DocumentPage>;
  chunks: ReadonlyArray<DocumentChunk>;
  embeddings: ReadonlyArray<DocumentEmbedding>;
  pageSummaries: Readonly<Record<number, string>>;
  parserNotice?: string;
  transientLog?: string;
  gate: GateState;
  indexedAt?: string;
}

/** Canonical node names - referenced by edges, tests, and README docs. */
export const NODE_NAMES = {
  parse: 'parse',
  chunk: 'chunk',
  embed: 'embed-chunks',
  summarize: 'summarize-page',
  metadata: 'metadata-collector',
  transient: 'transient-event',
  barrier: 'barrier',
  index: 'index',
} as const;

export type NodeName = (typeof NODE_NAMES)[keyof typeof NODE_NAMES];

/** Canonical state-field/channel names - kept in lockstep with `DocumentState`. */
export const CHANNEL_NAMES = {
  pages: 'pages',
  chunks: 'chunks',
  embeddings: 'embeddings',
  pageSummaries: 'pageSummaries',
  parserNotice: 'parserNotice',
  transientLog: 'transientLog',
  gate: 'gate',
  indexedAt: 'indexedAt',
} as const satisfies Readonly<Record<keyof DocumentState, keyof DocumentState & string>>;

/**
 * Sentinel value written to the `gate` `Barrier` channel by the
 * `embed-chunks` and `summarize-page` nodes. The cast is intentional:
 * each node writes a `true` flag and the runtime files it under the
 * writer's `nodeName`, so the merged record satisfies `GateState`.
 */
export const GATE_FIRED: GateState = true as unknown as GateState;

/**
 * Number of chunks produced per page. Kept as a tiny constant so the
 * pipeline's fan-out factor is easy to reason about in the README and
 * the smoke-test assertions.
 */
export const CHUNKS_PER_PAGE = 2 as const;
