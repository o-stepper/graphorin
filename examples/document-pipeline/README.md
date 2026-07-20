# document-pipeline

> Workflow concurrency acceptance demo for **graphorin** - wires `@graphorin/workflow`'s step-graph engine to an eight-node document ingestion pipeline (`parse` → fan-out `chunk` × N → `embed-chunks` + `summarize-page` → `barrier` → `index`, plus side nodes `metadata-collector` and `transient-event`) that exercises every channel kind shipped by `@graphorin/core` (`LatestValue`, `Reducer`, `Stream`, `Barrier`, `Ephemeral`, `AnyValue`) and the dynamic task primitive `Dispatch` end-to-end.

The example is small (≈300 lines of source, three files) but it covers the full channel matrix against the real `InMemoryCheckpointStore` so CI never depends on a live LLM, embedding service, or vector store.

---

## First 5 minutes

If you only want to see the workflow run end-to-end:

```bash
pnpm install
pnpm --filter ./examples/document-pipeline build
pnpm --filter ./examples/document-pipeline test
pnpm --filter ./examples/document-pipeline dev
```

Expected dev output:

```
graphorin v0.13.3 document-pipeline - status=completed, pages=4, chunks=8, embeddings=8, summaries=4, parserNotice='metadata-collector observed 4 page(s)', indexedAt='2026-…'.
```

**What just happened?**

1. `parse` consumed a synthetic 4-page document, dispatched `chunk` once per page, and recorded a top-level `parserNotice` (AnyValue) plus a one-shot `transientLog` ping (Ephemeral).
2. Four `chunk` tasks ran in parallel within a single execution step, each splitting its page into two sections and appending two `DocumentChunk` records onto the `chunks` `Stream` channel.
3. `embed-chunks` (consumer of the `chunks` stream) and `summarize-page` (per-page summary writer) ran in parallel in the next step. `embed-chunks` accumulated all 8 vectors via the `embeddings` `Reducer`; `summarize-page` overwrote `pageSummaries` (`LatestValue`) with the full per-page summary record. Both wrote a sentinel into the `gate` `Barrier` channel.
4. `barrier` waited until both writers had filed their sentinels (the `Barrier` channel only accepts writes from nodes named in `from`) and then fanned out to `index`.
5. `index` snapshotted the chunk/embedding count and stamped `indexedAt` (`LatestValue`).

That is the full concurrency pattern. The advanced section below walks through every channel kind with a code excerpt and explains the `Dispatch` scheduling contract.

---

## Quick map of the source

```
examples/document-pipeline/
├── src/
│   ├── main.ts              # createDocumentPipeline + runDocumentPipelineDemo + DOCUMENT_CHANNELS + CLI
│   ├── types.ts             # DocumentInput / DocumentState / DocumentChunk / DocumentEmbedding / GateState / NODE_NAMES
│   └── embedder-stub.ts     # deterministic 8-dim FNV-1a embedder used by `embed-chunks`
├── tests/
│   └── smoke.test.ts        # 6 vitest cases covering channels, fan-out, end-to-end state
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

---

## Pipeline architecture

```
                   ┌──────────────────┐
__start__ ───────▶ │      parse       │ ─dispatches▶ chunk × N
                   └──┬─────────┬─────┘
                      │         │
       (edges)        │         └────────────────────┐
                      ▼                              ▼
              ┌──────────────────┐         ┌──────────────────┐
              │ metadata-collector│         │  transient-event │
              └────────┬─────────┘         └─────────┬────────┘
                       │ (→ __end__)                 │ (→ __end__)
                       │                             │
        ┌──────────────────────────┐
        │         chunk × N        │  (parallel: dispatched per page)
        └──────┬────────────┬──────┘
               │            │
   (chunk → embed-chunks)   │ (chunk → summarize-page)
               │            │
               ▼            ▼
   ┌─────────────────┐  ┌──────────────────┐
   │  embed-chunks   │  │ summarize-page   │
   └────────┬────────┘  └─────────┬────────┘
            │ (gate ← embed)       │ (gate ← summarize)
            ▼                      ▼
            └────────┬─────────────┘
                     ▼
              ┌────────────┐
              │  barrier   │   waits until gate has both writers
              └─────┬──────┘
                    ▼
              ┌────────────┐
              │   index    │ ─▶ writes indexedAt (LatestValue)
              └─────┬──────┘
                    ▼
                __end__
```

Per-step trace for a 4-page document:

| Step | Tasks scheduled                                                           | Channel writes                                                          |
| :--: | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
|  0   | `parse`                                                                   | (boot)                                                                  |
|  1   | `chunk`×4 (dispatched), `metadata-collector`, `transient-event` (edges)   | `chunks` ×4, `parserNotice` (metadata), `transientLog` (transient-event)|
|  2   | `embed-chunks`, `summarize-page` (edges from `chunk`)                     | `embeddings`, `pageSummaries`, `gate` ×2                                |
|  3   | `barrier`                                                                 | (read-only - emits `barrier.ready` custom event)                        |
|  4   | `index`                                                                   | `indexedAt`                                                             |
|  5   | (none - `index → __end__` reachable, run terminates)                      | -                                                                       |

`parse` step also writes `parserNotice` (later overwritten by `metadata-collector` - `AnyValue` is last-write-wins) and `transientLog` (cleared at end of step 0 - `Ephemeral` semantics).

---

## Channel-types matrix

Each entry in `DOCUMENT_CHANNELS` exercises one channel kind from `@graphorin/core`. The smoke test inspects the discriminated `Channel.kind` field on every entry to assert the full matrix is covered.

| State field      | Channel kind     | Constructor (`@graphorin/core` re-exported via `@graphorin/workflow`)                            | Semantics                                                                                                          |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `pages`          | `latest-value`   | `latestValue<ReadonlyArray<DocumentPage>>({ default: [] })`                                      | Single-writer-per-step. Used here as the typed input mirror.                                                       |
| `chunks`         | `stream`         | `stream<ReadonlyArray<DocumentChunk>>({ default: [] })`                                          | Append-only queue. Each `chunk` task writes its sections; the runtime flattens arrays into the merged list.        |
| `embeddings`     | `reducer`        | `reducer<ReadonlyArray<DocumentEmbedding>>((prev, next) => [...prev, ...next], { default: [] })` | Folds writes via the user-supplied callback - concatenates per-batch embeddings into the running list.             |
| `pageSummaries`  | `latest-value`   | `latestValue<Readonly<Record<number, string>>>({ default: {} })`                                 | The full per-page summary record overwrites in one shot - last write per step wins.                                |
| `parserNotice`   | `any-value`      | `anyValue<DocumentState['parserNotice']>()`                                                      | Multiple writers allowed - last write within the step wins, no `MultiWriteError` even when several nodes coincide. |
| `transientLog`   | `ephemeral`      | `ephemeral<DocumentState['transientLog']>()`                                                     | Visible via `workflow.channel.update`, then **discarded** at the step boundary. Never lands in the checkpoint.     |
| `gate`           | `barrier`        | `barrier<GateState>([NODE_NAMES.embed, NODE_NAMES.summarize], { default: {} as GateState })`     | Accepts writes only from the named nodes; merged value is `Record<nodeName, value>` ready for downstream gating.   |
| `indexedAt`      | `latest-value`   | `latestValue<DocumentState['indexedAt']>()`                                                      | Single-writer terminal stamp set by the `index` node.                                                              |

### `LatestValue`

`LatestValue` rejects multiple writers per step with `MultiWriteError` so the contract is "exactly one author per step":

```ts
indexedAt: latestValue<DocumentState['indexedAt']>(),
// in the index node:
return { indexedAt: new Date().toISOString() } satisfies Partial<DocumentState>;
```

### `Reducer`

`Reducer` folds every write via the user-supplied callback. This example concatenates per-batch embeddings, but the same pattern works for tallies (`(p, n) => p + n`) or set unions:

```ts
embeddings: reducer<ReadonlyArray<DocumentEmbedding>>(
  (prev, next) => [...prev, ...next],
  { default: [] },
),
// in embed-chunks:
return { embeddings: newEmbeddings, gate: GATE_FIRED } satisfies Partial<DocumentState>;
```

### `Stream`

`Stream` is an append-only queue. Each writer either contributes a single item or an array (the runtime flattens). Set `unique: true` to deduplicate by deep-equality. Here the four parallel `chunk` tasks each write an array of two sections and the merged list ends up with eight chunks in deterministic order:

```ts
chunks: stream<ReadonlyArray<DocumentChunk>>({ default: [] }),
// in the chunk node:
return { chunks } satisfies Partial<DocumentState>; // chunks: DocumentChunk[]
```

### `Barrier`

`Barrier` accepts writes only from the named producers. The merged value is a `Record<nodeName, value>`, which lets downstream nodes gate on participation:

```ts
gate: barrier<GateState>([NODE_NAMES.embed, NODE_NAMES.summarize], { default: {} as GateState }),
// embed-chunks + summarize-page each return:
return { ..., gate: GATE_FIRED } satisfies Partial<DocumentState>;
// the barrier node sees: state.gate === { 'embed-chunks': true, 'summarize-page': true }
```

### `Ephemeral`

`Ephemeral` channels surface a `workflow.channel.update` event for each write but are wiped from state at the end of the step. Useful for one-shot signals that should never persist into a checkpoint:

```ts
transientLog: ephemeral<DocumentState['transientLog']>(),
// in transient-event:
return { transientLog: `transient-event:observed step=${ctx.stepNumber}` };
// state.transientLog is undefined again by step.end
```

### `AnyValue`

`AnyValue` is the lenient sibling of `LatestValue`: multiple writers per step do not throw, the last write wins. Across steps the most recent writer also wins, so subsequent overrides are observable in the final state:

```ts
parserNotice: anyValue<DocumentState['parserNotice']>(),
// parse writes early, metadata-collector overwrites later - no MultiWriteError.
```

---

## `Dispatch` dynamic parallelism

`parse` schedules one `chunk` task per input page using the `dispatch(nodeName, args)` factory:

```ts
import { dispatch } from '@graphorin/core'; // re-exported by @graphorin/workflow

const parse = createNode<DocumentState>({
  name: 'parse',
  run: (state) => {
    const dispatches = state.pages.map((page) =>
      dispatch<{ readonly page: DocumentPage }>('chunk', { page }),
    );
    return [
      ...dispatches,
      {
        parserNotice: `parser observed ${state.pages.length} page(s)`,
        transientLog: `parse:start pages=${state.pages.length}`,
      },
    ];
  },
});
```

The runtime collects each `Dispatch` returned from a node's `run(...)` callback and schedules the corresponding task in the next execution step. Every dispatched task receives `ctx.dispatchArgs` typed as `unknown` - narrow it locally:

```ts
const chunk = createNode<DocumentState>({
  name: 'chunk',
  run: (_state, ctx) => {
    const args = ctx.dispatchArgs as { readonly page: DocumentPage } | undefined;
    if (!args) throw new Error('chunk node requires dispatchArgs.page');
    // ... split args.page into two sections, return { chunks }.
  },
});
```

For a 4-page document the runtime produces four parallel `chunk` tasks within a single execution step. Subscribing with `stream: 'tasks'` makes the fan-out directly observable:

```ts
for await (const ev of wf.execute(input, { threadId, stream: 'tasks' })) {
  if (ev.type === 'workflow.task.start' && ev.nodeName === 'chunk') {
    console.log(`chunk task ${ev.taskId} started in step ${ev.stepNumber}`);
  }
}
```

The smoke test asserts the same invariant: at least one execution step contains ≥2 `workflow.task.start` events with `nodeName === 'chunk'`.

---

## Hermetic embedder

`embed-chunks` calls into `src/embedder-stub.ts`, an 8-dim FNV-1a-style hash that deterministically returns the same vector for the same text - no network, no model load, no temp directory. Swap it for a real embedder (`@graphorin/embedder-transformersjs`, `@graphorin/embedder-ollama`, …) by importing `EmbedderProvider.embed(...)` instead.

```ts
import { embed, STUB_EMBEDDING_DIM } from './embedder-stub.js';

const v = embed('hello graphorin');
// v.length === STUB_EMBEDDING_DIM (8); L2-normalised; deterministic.
```

---

## Public API exposed by the example

```ts
export const VERSION: string = pkg.version; // derived from package.json

export const DOCUMENT_CHANNELS: Readonly<{
  [K in keyof DocumentState]-?: Channel<DocumentState[K]>;
}>;

export function createDocumentPipeline(options: {
  checkpointStore: CheckpointStore;
}): Workflow<DocumentState, DocumentInput>;

export function runDocumentPipelineDemo(options: {
  pages: ReadonlyArray<DocumentPage>;
  checkpointStore: CheckpointStore;
  threadId?: string;
  stream?: StreamMode;
  signal?: AbortSignal;
}): Promise<{
  threadId: string;
  events: ReadonlyArray<WorkflowEvent<DocumentState>>;
  finalState: DocumentState;
  channelEvents: Readonly<Record<string, number>>;
  status: 'completed' | 'suspended' | 'running' | 'failed';
}>;

export function buildSyntheticDocument(pageCount: number): ReadonlyArray<DocumentPage>;
```

The CLI (`pnpm --filter ./examples/document-pipeline dev`) calls `runDocumentPipelineDemo({ pages: buildSyntheticDocument(4), checkpointStore: new InMemoryCheckpointStore() })`.

---

## Troubleshooting

- **`MultiWriteError: latest-value channel 'pageSummaries' written by ['summarize-page', 'summarize-page']`** - `LatestValue` rejects multiple writes per step. The example dispatches `chunk` per page (parallel) but keeps `summarize-page` as a single-writer node. If you fan out summaries per page, switch the channel to `Reducer<Record<number, string>>` instead.
- **`workflow.channel.update` for `transientLog` but `state.transientLog === undefined`** - that is the `Ephemeral` contract. The runtime emits the update event so observers can react, then discards the value at the step boundary. Use `LatestValue` (or `AnyValue`) for state that should persist across checkpoints.
- **`gate` ends up empty** - only nodes named in the channel's `from` list are allowed to write. Confirm both `embed-chunks` and `summarize-page` actually emit `gate: GATE_FIRED` in their return value.
- **`dispatch` types complain about `args`** - `dispatch<TArgs>(nodeName, args)` infers `TArgs` from the literal. Annotate explicitly when passing through helper functions: `dispatch<{ readonly page: DocumentPage }>('chunk', { page })`.

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.13.3 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
