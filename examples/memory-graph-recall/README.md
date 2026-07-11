# memory-graph-recall

> A five-stage **graphorin** memory deep-dive: the entity relation graph with `expandHops: 1` recall, the gated deep-recall loop with graded ABSTENTION, the quarantine + `fact_validate` trust gate, and the insights read tier - all in one deterministic flow over `:memory:` SQLite. Demonstrates the release-line 0.4 memory program (P1-1 / P1-4 / P2-1 / P2-4) end-to-end, fully offline.

The example is the smallest end-to-end illustration of the advanced memory stack: store a small cast of related facts with `(subject, predicate, object)` triples, watch one-hop graph expansion recall a fact the query never lexically matched, drive the grade-then-reformulate loop until it either answers or abstains, and walk a synthesized fact (and a reflection-shaped insight) through quarantine into validated recall.

---

## Prerequisites

- **Node.js 22.12+** (the workspace pins `>=22.12.0`).
- **pnpm 10.28+** (`corepack enable && corepack prepare pnpm@10.28.2 --activate`).
- No external services required. Embeddings come from a deterministic in-example hash embedder (no transformersjs, no model download) and the deep-recall grader is a scripted stub `Provider`, so every run is offline and byte-reproducible.

---

## Quick start

From the workspace root:

```bash
pnpm install
pnpm --filter ./examples/memory-graph-recall build
pnpm --filter ./examples/memory-graph-recall test
pnpm --filter ./examples/memory-graph-recall dev
```

Expected output:

```
stage 1 [store+graph]: stored 6 facts; embedder 'stub:hash@32' registered (dim=32, metric=cosine); entities=7
stage 2 [hop-recall]: baseline missed "Horizon Labs ships a robotics kit for schools."; expandHops=1 recalled it via entity 'Horizon Labs' (graph-leg-only=yes)
stage 3 [deep-recall]: answered "Where does Marta work?" (sufficient=true, graded=true, iterations=1); abstained on "What is the name of Marta's cat?" (abstained=true, iterations=2, gradeCalls=3)
stage 4 [quarantine]: synthesized fact born quarantined=yes (reason=synthesized); default recall hidden=yes; promoted via semantic.validate; recallable=yes
stage 5 [insights]: reflection-shaped insight inserted (cites=3, quarantined-hidden=yes); promoted via insights.validate; readable=yes, searchable=yes
memory-graph-recall: OK facts=7 entities=8 hopRecallHit=yes hopEntity='Horizon Labs' abstained=yes quarantinePromoted=yes insightReadable=yes gradeCalls=3 tools=12
```

The dev script boots a fresh `:memory:` SQLite store, runs the five stages through `runMemoryGraphRecall({ ... })`, prints one summary line per stage plus the final `memory-graph-recall: OK` stats line, and exits 0. Any broken stage invariant exits non-zero.

---

## How the pieces fit

One `createMemory(...)` call wires everything the five stages need:

```ts
import { createMemory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';

const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
await store.init();

const memory = createMemory({
  store: store.memory,
  embeddings: store.embeddings,
  embedder: createStubEmbedder(),               // deterministic hash embedder
  graph: { entityResolution: true },            // P2-1: entity graph on write
  iterativeRetrieval: { provider, maxIterations: 2 }, // P2-4: grader => deep recall
  contextEngine: { compaction: false },         // demo never assembles a prompt
  resolveScope: () => scope,
});
```

- **`embedder` + `embeddings`.** The stub embedder implements the `EmbedderProvider` contract (`id() / dim() / configHash() / embed()`); the facade binds it into the store's `embedding_meta` registry via `registerOrReturn`, which is idempotent - re-registering the same id + configHash returns the persisted row. The example calls it a second time on purpose to surface the registered metadata (`dim=32, metric=cosine`) in the stage-1 line.
- **`graph: { entityResolution: true }`.** Every `semantic.remember(...)` with a `subject` / `object` resolves those surface forms to canonical entities (lexical fold first, then embedding cosine) and links the fact, giving `search(..., { expandHops: 1 })` a graph to traverse.
- **`iterativeRetrieval: { provider }`.** Configures the retrieval grader, which also registers the gated `deep_recall` tool - the example's `memory.tools` surface counts 12 (the canonical 11 + `deep_recall`).

---

## Stage 1 - the cast

Six facts about a small cast, each carrying an s/p/o triple:

```ts
await memory.semantic.remember(scope, {
  text: 'Marta works at Horizon Labs.',
  subject: 'Marta',
  predicate: 'works_at',
  object: 'Horizon Labs',
});
// ... Marta lives in Tbilisi; Horizon Labs ships a robotics kit;
// Giorgi is Marta's brother; Giorgi teaches chess; Tbilisi sits on the Kura.
```

Entity resolution dedups the raw subject / object strings into 7 canonical entities (Marta, Giorgi, Horizon Labs, Tbilisi, robotics kit, chess, Kura river) and records the fact links in `fact_entities`.

## Stage 2 - graph recall with `expandHops: 1`

The probe query is `"Where does Marta work?"`. The hop target - `"Horizon Labs ships a robotics kit for schools."` - shares **zero tokens** with the query, so the FTS leg can never return it, and with `candidateTopK: 3` the near-orthogonal stub vectors keep it out of the KNN leg too. The one-hop expansion is the only way in:

```ts
const baseline = await memory.semantic.search(scope, 'Where does Marta work?', {
  topK: 8,
  candidateTopK: 3,
});
// baseline: Marta facts only - the robotics-kit fact is absent.

const expanded = await memory.semantic.search(scope, 'Where does Marta work?', {
  topK: 8,
  candidateTopK: 3,
  expandHops: 1, // P2-1: seed on the candidates, pull entity neighbours
});
// expanded: now ALSO contains the robotics-kit fact, fused in through
// the graph candidate list - its hit carries the `rrf.graph` signal and
// no `rrf.fts_*` / `rrf.vector_*` legs.
```

The flow then names the linking entity by walking the graph surface (`listEntities` + the exact `factsForEntityName` retriever) and finding the canonical entity whose linked fact set contains both a baseline hit and the hop fact: `Horizon Labs`.

## Stage 3 - deep recall: graded loop + abstention

`searchIterative` is the deliberate "deep recall" surface (the gated `deep_recall` tool wraps it). With a grader configured, a hard query is retrieved, **graded for sufficiency**, and - when weak - reformulated and retrieved again (widening to `expandHops: 1`) up to the iteration cap, then the loop **abstains** instead of confabulating:

```ts
const answered = await memory.semantic.searchIterative(scope, 'Where does Marta work?', {
  forceHard: true,   // the deep_recall switch: skip the heuristic gate
  maxIterations: 2,
  topK: 5,
});
// answered.sufficient === true, answered.graded === true, 1 iteration.

const unanswerable = await memory.semantic.searchIterative(
  scope,
  "What is the name of Marta's cat?",
  { forceHard: true, maxIterations: 2, topK: 5 },
);
// unanswerable.abstained === true after 2 passes - the caller should say
// "I don't know" rather than answer from the accumulated hits.
```

The grader is a scripted stub `Provider` (the `fakeProvider` idiom from the framework's own consolidator tests): three pre-scripted JSON verdicts - `sufficient: true` for the first question, then `insufficient + reformulation` and a final `insufficient` for the second, which trips the 2-pass cap into `abstained: true`. The smoke test pins the call count at exactly 3.

## Stage 4 - quarantine and `fact_validate`

A synthesized write (`provenance: 'extraction'`) is **born quarantined** (P1-4): persisted and auditable, but excluded from action-driving recall until a human validates it.

```ts
const outcome = await memory.semantic.rememberWithDecision(scope, {
  text: 'Marta is preparing a keynote for the Devfest conference.',
  subject: 'Marta',
  predicate: 'preparing',
  object: 'Devfest keynote',
  provenance: 'extraction', // synthesized => lands quarantined
  owner: 'agent',
});
// outcome.fact.status === 'quarantined', outcome.quarantineReason === 'synthesized'

// Default recall excludes it; the inspector path opts in explicitly:
await memory.semantic.search(scope, 'Devfest keynote');                              // absent
await memory.semantic.search(scope, 'Devfest keynote', { includeQuarantined: true }); // present

// Human review promotes it (the fact_validate tool calls the same API):
await memory.semantic.validate(scope, outcome.fact.id, 'human-review: example operator');
await memory.semantic.search(scope, 'Devfest keynote');                              // present
```

`validate` re-derives the injection verdict from the stored text, so a memory-poisoning candidate is refused promotion; this clean synthesized write promotes normally.

## Stage 5 - insights read tier

The only framework **write** path for insights is the consolidator's reflection pass (P1-1) - `InsightMemory` is a read/validate tier by design. The lowest-level supported public surface is the storage adapter's `InsightMemoryStoreExt.insert` (a `@stable` export of `@graphorin/memory`, implemented by the default sqlite adapter), so the example inserts a record shaped exactly like a reflection write: quarantined, `provenance: 'reflection'`, starting salience 2, and **mandatory citations**:

```ts
const adapter: MemoryStoreAdapter = store.memory;
await adapter.insights?.insert({
  id: 'ins_demo_...',
  kind: 'insight',
  userId: scope.userId,
  text: 'Marta guards her Saturday family time, so avoid proposing Saturday work sessions.',
  cites: [employerFact.id, brotherFact.id, chessFact.id], // >= 1, always
  salience: 2,
  provenance: 'reflection',
  status: 'quarantined',
  owner: 'agent',
  sensitivity: 'internal',
  createdAt: new Date().toISOString(),
});

// Read tier: hidden by default while quarantined, then promoted + read back.
await memory.insights.list(scope);                              // absent
await memory.insights.list(scope, { includeQuarantined: true }); // present (review queue)
await memory.insights.validate(scope, insightId, 'human-review: example operator');
await memory.insights.list(scope);                              // present
await memory.insights.search(scope, 'Saturday');                // FTS hit
```

---

## Determinism notes

- **Hash embedder.** Texts are FNV-1a-hashed into unit vectors, so unrelated texts are nearly orthogonal - the conflict pipeline's cosine zones stay quiet, the vector leg is stable across runs, and no model is downloaded. The idiom mirrors the framework's own test fixture (`packages/memory/tests/fixtures/in-memory-store.ts`).
- **Scripted provider.** The grader plan is a fixed array of `ProviderResponse`s replayed in order; a call past the end throws, and the smoke test asserts the exact call count, so any drift in the loop's provider usage fails loudly.
- **No wall-clock coupling.** Nothing sleeps, polls, or depends on timers; the only timestamps are record `createdAt` fields.

---

## Public API

The example exports a small, typed surface other packages can build on:

- `runMemoryGraphRecall({ log?, env? })` - runs the five stages against a fresh `:memory:` store and returns the structured `MemoryGraphRecallResult` (hop-recall verdicts, both `IterativeRecallResult`s, quarantine + insight outcomes, the final stats line).
- `main({ env? })` - CLI wrapper: prints one line per stage plus the final `memory-graph-recall: OK ...` line; returns the process exit code.
- `createStubEmbedder()` / `STUB_EMBEDDER_ID` - the deterministic hash `EmbedderProvider`.
- `createScriptedProvider(plan)` / `gradeResponse({...})` - the scripted `Provider` and a helper that renders a retrieval-grader verdict as a `ProviderResponse`.
- `CAST_FACTS`, `HOP_QUERY`, `ANSWERABLE_QUERY`, `UNANSWERABLE_QUERY`, `GRADE_SCRIPT`, `DEMO_SCOPE`, `VERSION` - the fixture constants the smoke test reuses.

All public files start with the canonical `Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko` header and use only the public types from `@graphorin/core`, `@graphorin/memory`, `@graphorin/store-sqlite`.

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper` - every stage then prints its `memory.write.semantic` / `memory.search.semantic` spans, including the iterative-loop attributes (`...iterative.abstained`, `...iterative.iterations`) and the graph-expansion counters. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.8.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
