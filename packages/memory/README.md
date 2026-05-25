# @graphorin/memory

> Six-tier memory system for the Graphorin framework — the heart of any
> long-living personal AI assistant built on top of Graphorin.

`@graphorin/memory` ships the `createMemory()` facade, the six tier
sub-modules (working, session, episodic, semantic, procedural, shared),
the eleven memory tools that the agent runtime registers with
`@graphorin/tools`, the built-in Reciprocal Rank Fusion reranker (k=60),
the embedder migration runner, and the interface stubs picked up later
by the conflict-resolution pipeline, the consolidator, and the context
engine.

The package depends on:

- `@graphorin/core` — typed contracts (`MemoryStore`, `EmbedderProvider`,
  `Tool`, `Tracer`, `Sensitivity`, …).
- `@graphorin/observability` — the `Tracer` used to emit one `AISpan`
  per memory operation.
- `@graphorin/security` — the memory-modification guard (`MemoryGuardTier`)
  every memory tool is wired against.
- `@graphorin/tools` — the `tool({...})` builder used to declare the
  ten memory tools.
- `zod` (peer) — schema typing for the memory tools.

Storage is provided by any `MemoryStore` implementation; the default
production adapter is `@graphorin/store-sqlite` (built on
`better-sqlite3@^12.9.0` + `sqlite-vec@~0.1.9`). Embeddings come from
any `EmbedderProvider`; the default is
`@graphorin/embedder-transformersjs` (multilingual e5 base, 768-dim).

## Highlights

- **`createMemory({ store, embedder, ...})` facade.** Wires the six
  tiers + the tools array + the `compile()` / `metadata()` /
  `consolidator` interface stubs in one call.
- **Six tier sub-modules.** Every tier exposes a typed CRUD surface and
  emits one `AISpan` per operation. Writes are append-only (soft-delete
  via `deletedAt` / `validTo`); supersede chains are first-class.
- **Hybrid search.** Semantic memory composes vector + FTS5 results
  through the built-in `RRFReranker` (k=60 default). The
  `setReranker(custom)` hook accepts any `ReRanker` implementation
  (cross-encoder, LLM judge, custom).
- **Eleven memory tools.** `block_append`, `block_replace`,
  `block_rethink`, `fact_remember`, `fact_search`, `fact_supersede`,
  `fact_forget`, `recall_episodes`, `conversation_search`,
  `fact_history`, `fact_validate` — every tool is a typed `Tool` with
  `inputSchema` + `outputSchema`, the appropriate `memoryGuardTier`, and
  the right `sideEffectClass`. `fact_search` accepts an `asOf` instant
  for point-in-time reads; `fact_history` returns a fact's bi-temporal
  supersede chain; `fact_validate` promotes a quarantined fact to active.
- **Provenance + quarantine (memory-safety gate).** Every fact carries
  a `provenance` tag (`user` / `tool` / `extraction` / `reflection` /
  `imported`) and a retrieval-trust `status`. *Derived* writes
  (consolidator extraction, future reflection) and candidates that trip
  the offline injection heuristics (`ignore previous instructions`,
  role-markup smuggling, secrecy / exfiltration directives) land
  `status: 'quarantined'` and are **excluded from default recall** until
  a human promotes them via `fact_validate`. Quarantine is a retrieval
  gate, never a delete — quarantined rows stay fully auditable, and the
  `includeQuarantined` search option surfaces them for the validation
  UI. This is the precondition for safely shipping synthesized memory
  (reflection / reconciliation / induction) against memory-poisoning
  (MINJA, MemoryGraft).
- **Multi-stage conflict resolution pipeline.** Every
  `SemanticMemory.remember(...)` call now flows through a five-stage
  pipeline (exact dedup → embedding three-zone → heuristic regex →
  subject/predicate → defer-to-deep). Decisions are recorded into
  `fact_conflicts`; ambiguous cases land in the `conflict_check_pending`
  queue for the consolidator's deep phase. The English locale pack
  ships by default; additional locales plug in via
  `defineLocalePack({...})`. Operators can disable the pipeline with
  `createMemory({ conflictPipeline: { mode: 'off' } })` (a one-shot
  WARN surfaces so the regression risk is visible).
- **Neighbour-aware write reconciliation** (consolidator standard phase).
  Extracted facts are reconciled against their nearest neighbours via an
  extract→reconcile loop: a cheap pre-filter (the pipeline's exact-dedup +
  embedding zones over `SemanticMemory.neighbors(...)`) resolves clear
  duplicates / independents with no LLM call, and only the ambiguous mid-zone
  spends one reconcile pass choosing add / update / noop / conflict. Updates
  and conflicts route through the bi-temporal supersede (never a delete);
  every decision is audited in `fact_conflicts` and new facts inherit the
  `extraction` provenance gate.
- **Auto-importance + episode formation** (consolidator standard phase).
  Each processed slice is summarized into one episode via a single budgeted
  LLM call that also rates its importance `1–10` (normalized to `[0, 1]`),
  so episodic triple-signal retrieval (recency × relevance × importance) finally
  runs on all three signals. Auto-formed episodes carry `provenance: 'extraction'`
  + `status: 'quarantined'` (P1-4) — surfaced for review via
  `episodic.search(..., { includeQuarantined: true })`. Importance is a *soft*
  signal (never a retention gate). Controlled by the per-tier `formEpisodes` /
  `importanceScoring` flags (on at `standard` / `full`); budget-aware
  (an exhausted budget degrades to fact-only).
- **Reflection + insight synthesis** (consolidator deep phase). When the
  accumulated importance of recent episodes crosses `importanceThreshold`, the
  deep phase asks the model for the few most salient questions, retrieves
  evidence for each, and synthesizes a higher-order **insight** (Generative
  Agents). Insights are a distinct memory type (`memory.insights`:
  `search` / `list`) that land `provenance: 'reflection'` +
  `status: 'quarantined'`, carry **mandatory citations set from the retrieved
  evidence** (never hallucinated), and are **rank-capped below the facts they
  cite** (`capInsightsBelowFacts`). An ExpeL salience counter (start `2`,
  pruned at `0`) manages the set. Off by default except at the `full` tier;
  budget-aware and a no-op without an episodic tier + insight-capable store.
- **Contextual retrieval** (write path). Before a fact is embedded + FTS-indexed
  the framework prepends a short **situating context** (entities / timeframe /
  topics, Anthropic's Contextual Retrieval) so a terse fact stays findable; the
  canonical `text` is preserved. The offline default `'late-chunk'`
  (`createMemory({ contextualRetrieval })`) derives the context deterministically
  from the fact's own structured signals with **no extra LLM call** — a no-op for
  plain-text writes. An opt-in, **consolidator-only** `'llm'` mode
  (`consolidator: { contextualRetrieval: 'llm' }`) spends one budgeted cheap-model
  call per write to author the prefix, degrading to late-chunk on any failure.
- **Recall explainability** ("why was this recalled?"). `explainRecall(hits, {
  query, rerankerId })` decomposes a `search(...)` result into the per-memory
  signals that drove its score (`bm25` / `vector` / fused `rrf` / `decay`), in
  final-rank order; `formatRecallExplanation(...)` renders it. `search` also
  records the decay multiplier as a `decay` signal and attaches the breakdown
  (ids + scores + signals, never the query text) to the `memory.search.semantic`
  span. Operators inspect the rest via `graphorin memory inspect <factId>`
  (supersede chain / quarantine / conflicts / citing insights) and
  `graphorin memory activity` (consolidator / reflection activity).
- **Per-record `embedder_id` enforced.** Every embedded write registers
  the embedder via the storage layer's `EmbeddingMetaRepository` and
  records the canonical id (`'<provider>:<model>@<dim>'`); attempts to
  silently swap embedders fail-fast under the default `lock-on-first`
  policy.
- **Embedder migration runner** (`migrateEmbedder`). Three strategies:
  `lock-on-first` (default; refuses silent swap), `multi-active` (read
  union, write to active), `auto-migrate` (re-embeds existing rows in
  resumable batches; checkpointed via the `migration_state` table; can
  be aborted with `AbortSignal`).
- **Multi-agent attribution.** Every session message carries an
  optional `agentId`; `Session.list({ agentId })` filters per-agent;
  `Session.attributedFor(...)` exposes the registry; episodes can be
  recorded `'merged'` / `'per-agent'` (the rendering mode is consumed
  by the consolidator in Phase 10c).
- **Default-on bi-temporal storage.** Fact writes set `validFrom = now`
  and leave `validTo = null`; a supersede closes the old fact's `validTo`
  (so `as_of` queries reflect the change) and keeps the chain intact for
  later replay. The advanced `as_of_date` query API is opt-in
  (post-MVP).
- **`memory.compile(scope)` + `memory.metadata(scope)`.** The
  interface used by the context engine (Phase 10d) to assemble the
  six-layer memory-aware system prompt; `@graphorin/memory@0.3.0`
  ships the deterministic minimum-viable rendering so the agent
  runtime in Phase 12 can already exercise the surface.
- **Memory-modification guard wiring.** Every tool's
  `memoryGuardTier` is annotated per `DEC-153`; the executor in
  `@graphorin/tools` honours the tier through the `createGuard(...)`
  helper from `@graphorin/security/guard`.

## Stable sub-paths

```ts
import { createMemory } from '@graphorin/memory';
import { RRFReranker } from '@graphorin/memory/search';
import { migrateEmbedder } from '@graphorin/memory/migration';
import {
  blockAppendTool,
  factRememberTool,
} from '@graphorin/memory/tools';
import {
  EmbedderRegistrationError,
  MemoryToolDeniedError,
} from '@graphorin/memory/errors';
import {
  createConflictPipeline,
  defineLocalePack,
  enLocalePack,
  DEFAULT_CONFLICT_THRESHOLDS,
} from '@graphorin/memory/conflict';
```

## Quick start

```ts
import { createSqliteStore } from '@graphorin/store-sqlite';
import { createTransformersJsEmbedder } from '@graphorin/embedder-transformersjs';
import { createMemory } from '@graphorin/memory';

const sqlite = await createSqliteStore({ path: './assistant.db' });
await sqlite.init();

const memory = createMemory({
  store: sqlite.memory,
  embeddings: sqlite.embeddings,
  embedder: createTransformersJsEmbedder(),
});

await memory.semantic.remember(
  { userId: 'alex' },
  { text: 'Loves mountain hiking and fresh espresso.' },
);

const hits = await memory.semantic.search(
  { userId: 'alex' },
  'mountain trip ideas',
);
console.log(hits[0]?.record.text);
```

## Tier overview

| Tier        | Surface (read)                               | Surface (write)                                             |
|-------------|-----------------------------------------------|-------------------------------------------------------------|
| working     | `list`, `read`, `compile`                     | `define`, `write`, `patch`, `attach`, `detach`              |
| session     | `list`, `search`, `attributedFor`             | `push`, `flushImportant`, `compact`                         |
| episodic    | `recent`, `search`                            | `record`                                                    |
| semantic    | `search`                                      | `remember`, `supersede`, `forget`                           |
| procedural  | `list`, `activate`                            | `define`, `remove`                                          |
| shared      | `listFor`                                     | `attach`, `detach`                                          |

## Memory tools (registered with `@graphorin/tools`)

`memory.tools` is a typed `Tool[]`. Pass it through to
`createToolRegistry({ ... })` (Phase 12) so the agent loop sees every
tool exactly once:

| Tool name            | Tier       | Purpose                                                |
|----------------------|------------|--------------------------------------------------------|
| `block_append`       | working    | Append text to a working memory block.                 |
| `block_replace`      | working    | Replace a unique substring inside a block.             |
| `block_rethink`      | working    | Replace a block's value entirely.                      |
| `fact_remember`      | semantic   | Persist a new fact through the multi-stage conflict pipeline. |
| `fact_search`        | semantic   | Hybrid (vector + FTS5 + RRF) search over facts.        |
| `fact_supersede`     | semantic   | Mark an old fact superseded by a new one.              |
| `fact_forget`        | semantic   | Soft-delete a fact (kept for replay).                  |
| `recall_episodes`    | episodic   | Triple-signal episode retrieval.                       |
| `conversation_search`| session    | FTS5 search over the active session messages.          |
| `fact_history`       | semantic   | Trace a fact's bi-temporal supersede chain.            |
| `fact_validate`      | semantic   | Promote a quarantined fact to active (audited).        |

## Embedder migration

```ts
import { migrateEmbedder } from '@graphorin/memory/migration';
import { createTransformersJsEmbedder } from '@graphorin/embedder-transformersjs';

const target = createTransformersJsEmbedder({ model: 'Xenova/multilingual-e5-large' });

for await (const progress of migrateEmbedder({
  store: sqlite,
  embeddings: sqlite.embeddings,
  source: memory.embedder,
  target,
  strategy: 'auto-migrate',
})) {
  console.log(`${progress.processed}/${progress.total} (${progress.kind})`);
}
```

`lock-on-first` (default) refuses any silent embedder swap with an
actionable error pointing at the planned migration. `multi-active`
keeps both vec0 tables alive (reads union, writes to active).
`auto-migrate` re-embeds rows in resumable batches (checkpointed
via the storage layer's `migration_state` table; can be aborted
with `AbortSignal`).

## Conflict pipeline (Phase 10b)

```ts
import { createMemory, defineLocalePack } from '@graphorin/memory';

const memory = createMemory({
  store: sqlite.memory,
  embeddings: sqlite.embeddings,
  embedder: createTransformersJsEmbedder(),
  conflictPipeline: {
    mode: 'on', // default
    thresholds: { hot: 0.95, nearDup: 0.85, cold: 0.4 },
    localePack: defineLocalePack({ id: 'fr', /* ... */ }),
  },
});

const outcome = await memory.semantic.rememberWithDecision(scope, {
  text: 'I just moved to Tbilisi for the new gig.',
});
console.log(outcome.decision.kind); // 'supersede' | 'dedup' | 'pending' | 'admit'
```

The pipeline visits five stages in order:

1. **Exact dedup** — MD5 hash on the canonical (lowercase + collapsed-
   whitespace + trimmed) candidate body short-circuits on a hit.
2. **Embedding three-zone** — top-K neighbours from `searchVector`
   classify the candidate into HOT (`>= 0.95`), NEAR-DUP
   (`>= 0.85`), CONFLICT-CHECK (`> 0.4`), or COLD. HOT zone always
   dedups (semantic identity outranks every other signal).
3. **Heuristic regex** — the active locale pack's supersede +
   negation markers fire when the candidate has an explicit
   change signal (`moved to`, `no longer`, `got promoted`, …) and
   there is at least one existing candidate.
4. **Subject / predicate** — naive `(subject, predicate, object)`
   split using the locale pack's predicate normalisers; matching
   subject + predicate with a different object is a strong supersede
   signal.
5. **Defer to deep LLM judge** — Stages 1–4 yielded no decision but
   the candidate sits in CONFLICT-CHECK zone — the row is admitted
   `pending` and queued in `conflict_check_pending` for the
   consolidator's deep phase (Phase 10c).

Every decision lands one row in `fact_conflicts` with the producing
stage, the detection zone, the cosine similarity (where applicable),
and a reason string for replay/debug. A `memory.conflict` AISpan is
emitted per call.

`createMemory({ conflictPipeline: { mode: 'off' } })` falls back to the
10a straight-through write path; a single per-process WARN surfaces so
operators notice that bi-temporal supersede / dedup will not fire.

## Forward links

| Surface                             | Owned by   |
|--------------------------------------|------------|
| Background `Consolidator` (triggers + 3 phases + DLQ + cost budget)            | Phase 10c |
| Six-layer memory-aware system prompt + locale-aware base templates             | Phase 10d |
| `@graphorin/sessions` hybrid facade wrapping `memory.session.*`                 | Phase 11  |
| `@graphorin/agent` wiring `memory.tools` into the tool registry                | Phase 12  |
| `/v1/memory` REST + `graphorin memory migrate` CLI                              | Phases 14 / 15 |

## License

MIT © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.3.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
