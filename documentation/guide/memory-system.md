---
title: Memory system
description: Six tiers of memory — working, session, episodic, semantic, procedural, shared — plus derived insights, hybrid search with weighted fusion, an entity graph, bi-temporal time-travel, a memory-safety gate, and a background consolidator.
---

# Memory system

Most frameworks treat memory as one undifferentiated bag. Graphorin treats it as **six layers**, each with its own lifecycle, conflict-resolution strategy, and privacy posture. Together they give your assistant a memory it can actually live with — for years.

## The six tiers

```mermaid
flowchart LR
    A[Working<br/>milliseconds-minutes<br/>current task]
    B[Session<br/>minutes-hours<br/>rolling message log]
    C[Episodic<br/>days-years<br/>bi-temporal autobiography]
    D[Semantic<br/>weeks-permanent<br/>facts about the world]
    E[Procedural<br/>grows over time<br/>learned patterns]
    F[Shared<br/>cross-agent<br/>household/team]
    G[Insights<br/>derived<br/>reflected knowledge]

    A --> B --> C --> D
    D --> E
    D --> F
    C -.-> G
    D -.-> G
```

| Tier | What it stores | Read surface | Write surface |
|---|---|---|---|
| **working** | Short structured blocks holding what the assistant is doing right now — persona, current task, immediate context. | `list`, `read`, `compile` | `define`, `write`, `patch`, `attach`, `detach` |
| **session** | The rolling message log of the current conversation. | `list`, `search`, `attributedFor` | `push`, `flushImportant`, `compact` |
| **episodic** | Things that happened — decisions, events, milestones — captured with proper bi-temporal validity. | `recent`, `search` | `record` |
| **semantic** | Facts about you, the world, the task. Conflicts resolved through a multi-stage pipeline. | `search`, `searchIterative`, `history` | `remember`, `supersede`, `forget`, `validate` |
| **procedural** | How to do things — workflows, recipes, learned patterns. | `list`, `activate` | `define`, `remove`, `induce` |
| **shared** | Common knowledge across multiple agents in the same household, team, or organisation. | `listFor` | `attach`, `detach` |

### Derived: insights (`memory.insights`)

A seventh, **read-only** surface sits above the six. It is never written to directly — the consolidator's deep phase *synthesises* it from your episodes and facts (see [Reflection](#reflection-insight-synthesis)). `memory.insights` exposes `search` / `list`; on a store without insight support it is an empty no-op.

## The facade

Every tier is wired through one entry point — `createMemory({ ... })`:

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
```

Everything above runs **fully offline** with no provider. The richer capabilities below are **opt-in** — they only ever call a model when you wire one in:

| `createMemory` option | Turns on | Default without it |
|---|---|---|
| `consolidator: { tier, provider }` | Background distillation — episodes, insights, forgetting (see [Consolidator](#background-consolidator)). | `'free'` tier — `light` phase pinned to a zero budget (effectively off). |
| `graph: { entityResolution: true }` | Entity resolution on write + `expandHops` graph search (see [Relation graph](#relation-graph-one-hop-expansion)). | No linking; `expandHops` defaults to `0`. |
| `queryTransform: { provider }` | Multi-query / RAG-Fusion + HyDE on `search` (see [Query transformation](#query-transformation)). | Single-shot, offline search. |
| `iterativeRetrieval: { provider }` | Grade-then-reformulate `searchIterative` + the `deep_recall` tool (see [Iterative retrieval](#agentic-iterative-retrieval)). | One difficulty-gated pass, no provider call. |
| `procedureInduction: { provider }` | `procedural.induce(...)` workflow learning (see [Procedural induction](#procedural-memory-induction)). | `induce(...)` throws; procedural stays pure CRUD. |
| `reranker` | Swap the default fusion reranker (see [Hybrid search](#hybrid-search)). | Reciprocal Rank Fusion (`k=60`). |

## The eleven memory tools

`memory.tools` is a typed `Tool[]` ready to register with `@graphorin/tools`. Every entry exposes typed input / output schemas, the right memory-modification guard tier, and the right `sideEffectClass` so that the agent runtime can sandbox and audit it.

| Tool | Tier | Purpose |
|---|---|---|
| `block_append` | working | Append text to a working memory block. |
| `block_replace` | working | Replace a unique substring inside a block. |
| `block_rethink` | working | Replace a block's value entirely. |
| `fact_remember` | semantic | Persist a new fact through the multi-stage conflict pipeline. |
| `fact_search` | semantic | Hybrid (vector + FTS5 + RRF) search over facts. Accepts an `asOf` instant for point-in-time reads. |
| `fact_supersede` | semantic | Mark an old fact superseded by a new one. |
| `fact_forget` | semantic | Soft-delete a fact (kept for replay). |
| `fact_history` | semantic | Trace a fact's bi-temporal supersede chain. |
| `fact_validate` | semantic | Promote a quarantined fact to active (audited). |
| `recall_episodes` | episodic | Triple-signal episode retrieval. |
| `conversation_search` | session | FTS5 search over the active session messages. |

These eleven are always registered. A **twelfth**, `deep_recall` (iterative grade-then-reformulate recall), is appended **only when** you configure `iterativeRetrieval` — so the default offline surface stays at exactly eleven and the original tool indices never shift.

## Hybrid search

Semantic memory composes dense-vector results with full-text (FTS5) results and fuses them through the built-in **Reciprocal Rank Fusion** reranker (`k=60` by default). The fusion is deterministic, requires no extra model, and rarely needs tuning.

```ts
import { RRFReranker } from '@graphorin/memory/search';

memory.semantic.setReranker(new RRFReranker({ k: 60 }));
```

Once you have labelled data (the `@graphorin/evals` harness), a **calibrated weighted fusion** can beat plain RRF — and **query transformation** can recover memories whose stored wording differs from the question. Both are covered in [Rerankers & fusion](/guide/rerankers). In brief:

```ts
// Weight the retrievers per-call — RRF stays the default; equal weights reproduce it exactly.
await memory.semantic.search(scope, 'where does anna live now', {
  fusion: { strategy: 'weighted', weights: { vector: 3, fts: 1 } },
});
```

### Contextual retrieval

A terse fact like `"moved to Tbilisi"` is hard to find later because the embedding and the FTS index lose the surrounding context. Before a fact is indexed Graphorin prepends a short **situating context** (entities / timeframe / topics — Anthropic's *Contextual Retrieval*), while preserving the canonical `text` you read back.

The default mode, `'late-chunk'`, derives that context **deterministically from the fact's own structured signals with no extra LLM call** (and is a no-op for plain free-text writes), so it stays fully offline. An opt-in, **consolidator-only** `'llm'` mode spends one budgeted cheap-model call per write to author the prefix, degrading to late-chunk on any failure.

```ts
createMemory({ /* … */ contextualRetrieval: 'late-chunk' }); // default
// consolidator: { contextualRetrieval: 'llm' }  // opt-in, consolidator writes only
```

### Query transformation

When the question and the stored fact use different words, one query may miss. `multiQuery` fans the query into reworded variants (RAG-Fusion) and `hyde` embeds a hypothetical answer — both fused through the same reranker:

```ts
await memory.semantic.search(scope, 'what does alex like to drink', {
  multiQuery: 3,   // original + up to 2 reworded variants, then fuse
  hyde: true,      // also embed a hypothetical answer and fuse its neighbours
});
```

Both are **opt-in**: wire `createMemory({ queryTransform: { provider } })`. With no transformer configured (the default) these options are silent no-ops and search stays offline + single-shot. Reserve them for retrieval-heavy recall — they add provider latency.

## Relation graph & one-hop expansion

Every fact can carry a `(subject, predicate, object)` triple. When you enable the **entity resolver**, Graphorin folds the subject/object strings into canonical entities — `"Anna"`, `"Anna S."`, `"my sister"` collapse to one entity — via lexical + embedding dedup, with **auditable, reversible merges** (an append-only ledger; `merged_into` is single-level).

At read time, one-hop expansion answers associative questions without leaving SQLite:

```ts
createMemory({ /* … */ graph: { entityResolution: true } }); // opt-in; offline

await memory.semantic.search(scope, 'what did the person I met in Tbilisi recommend?', {
  expandHops: 1, // seed on the candidates, fuse in facts sharing an entity (recursive CTE)
});
```

The ambiguous-similarity band **mints a new entity by default** — it never auto-merges on weak evidence. Opt into LLM adjudication (`graph: { llmAdjudication: true, provider }`) to resolve that band. Omit `graph` entirely and the path is unchanged and fully offline (`expandHops` defaults to `0`).

## Agentic / iterative retrieval

For hard multi-hop or temporal questions one pass can't answer, `searchIterative` runs a **grade-then-reformulate loop** (CRAG / Self-RAG). A cheap **local difficulty gate** keeps simple lookups single-shot; only a query judged *hard* — and only when a grader is configured — is graded for sufficiency and, when weak, reformulated and retrieved again (widening to one-hop graph expansion each round), up to a hard-capped `maxIterations` (≤ 5). If it still can't satisfy the question it **abstains** rather than confabulating:

```ts
createMemory({ /* … */ iterativeRetrieval: { provider } }); // opt-in

const result = await memory.semantic.searchIterative(scope, 'who introduced me to my current employer?');
if (result.abstained) {
  // no confident answer — surface "I don't know" instead of guessing
}
```

Exposed programmatically as `searchIterative(...)` and as the gated **`deep_recall`** tool (the twelfth tool). Omit `iterativeRetrieval` and `searchIterative` degrades to one difficulty-gated pass with **no provider call**, and the tool surface stays at eleven.

## Multi-stage conflict resolution

```mermaid
flowchart LR
    A[New fact candidate] --> S1[1. Exact dedup<br/>MD5 of normalised text]
    S1 --> S2[2. Embedding 3-zone<br/>HOT / NEAR-DUP / CONFLICT-CHECK / COLD]
    S2 --> S3[3. Heuristic regex<br/>locale supersede + negation markers]
    S3 --> S4["4. Subject / predicate<br/>naive (S, P, O) split"]
    S4 --> S5[5. Defer to deep<br/>LLM judge in consolidator]
    S5 --> Out[fact_conflicts row<br/>+ memory.conflict span]
```

Every `semantic.remember(...)` call flows through five stages in order:

1. **Exact dedup.** MD5 hash on the canonical (lowercase, collapsed-whitespace, trimmed) candidate body short-circuits on a hit.
2. **Embedding three-zone.** Top-K neighbours from `searchVector` classify the candidate into HOT (`>= 0.95`), NEAR-DUP (`>= 0.85`), CONFLICT-CHECK (`> 0.4`), or COLD. HOT zone always dedups (semantic identity outranks every other signal).
3. **Heuristic regex.** The active locale pack's supersede + negation markers fire when the candidate has an explicit change signal (`moved to`, `no longer`, `got promoted`, …).
4. **Subject / predicate.** Naive `(subject, predicate, object)` split using the locale pack's predicate normalisers; matching subject + predicate with a different object is a strong supersede signal.
5. **Defer to deep LLM judge.** Stages 1–4 yielded no decision but the candidate sits in CONFLICT-CHECK zone — the row is admitted `pending` and queued for the consolidator's deep phase.

Every decision lands one row in the `fact_conflicts` table with the producing stage, the detection zone, the cosine similarity (where applicable), and a reason string. A `memory.conflict` span is emitted per call. The English locale pack ships by default; additional locales plug in via `defineLocalePack({...})`.

The consolidator's standard phase reuses this same machinery for **neighbour-aware write reconciliation**: extracted facts are checked against their nearest neighbours by a cheap pre-filter (exact-dedup + embedding zones), and only the genuinely ambiguous mid-zone spends one reconcile pass choosing *add / update / noop / conflict*. Updates and conflicts route through bi-temporal supersede — never a delete.

## Bi-temporal storage & time-travel

Fact writes set `validFrom = now` and leave `validTo = null`. A supersede **closes** the old fact's `validTo` (it is never silently overwritten) and keeps the chain intact for replay — every change is auditable.

```ts
const decision = await memory.semantic.rememberWithDecision(scope, {
  text: 'I just moved to Tbilisi for the new gig.',
});
console.log(decision.kind);
// 'supersede' | 'dedup' | 'pending' | 'admit'
```

Because `validTo` is closed on supersede, you can read memory **as it was at any past instant** — and trace how a single fact evolved:

```ts
// Point-in-time read: what did we believe last spring?
const past = await memory.semantic.search(scope, 'where does alex live', {
  asOf: '2025-04-01T00:00:00Z', // ISO-8601 instant
});

// The full supersede chain for one fact, oldest → newest.
const chain = await memory.semantic.history(scope, factId);
```

`asOf` is also exposed on the `fact_search` tool, and `history` as the `fact_history` tool.

## Memory safety: provenance & quarantine

Long-living memory is a poisoning target: a malicious tool result or a confabulated extraction can plant a "fact" that later steers the assistant. Graphorin gates every write with **provenance** and **quarantine** — distinct from the agent-runtime [data-flow / taint policy](/guide/security#provenance-data-flow-policy), which governs *tool* I/O.

Every fact (and episode, insight, induced procedure) carries:

- a **`provenance`** tag — `user`, `tool`, `extraction`, `reflection`, `induction`, or `imported`; and
- a retrieval-trust **`status`** — `active` or `quarantined`.

*Derived* writes (consolidator extraction, reflection, workflow induction) and any candidate that trips the offline **injection heuristics** (`ignore previous instructions`, role-markup smuggling, secrecy / exfiltration directives) land `status: 'quarantined'` and are **excluded from default recall** until a human promotes them with `fact_validate`:

```ts
await memory.semantic.validate(scope, factId); // quarantined → active, audited

// Review queue: surface quarantined rows explicitly.
const pending = await memory.semantic.search(scope, '', { includeQuarantined: true });
```

Quarantine is a **retrieval gate, never a delete** — quarantined rows stay fully auditable. This is the precondition for safely shipping synthesised memory (reflection / reconciliation / induction) against memory-poisoning attacks. See [Security](/guide/security#memory-safety-provenance-quarantine) for the threat model.

## Procedural memory & induction

The procedural tier stores *how to do things*. You can author procedures directly with `define(...)`, or — opt-in — let the assistant **learn** them from its own successful runs (Agent Workflow Memory):

```ts
createMemory({ /* … */ procedureInduction: { provider } }); // opt-in

// After a run completes successfully, distil a reusable workflow.
const rule = await memory.procedural.induceFromRun(scope, runState);
// goal + value-abstracted steps ("search for {product}") + success criteria
```

Induction fires on **success only** — a failed run never calls the inducer — and the result lands **quarantined** with `provenance: 'induction'`. Because procedures drive *actions*, this is the highest-risk synthesised write, so induced procedures are **excluded from `activate()`** until validated (`list()` still surfaces them for review). `trajectoryFromRunState(runState)` distils the agent's already-emitted run state, so capturing a trajectory needs **no agent change**. Without `procedureInduction`, `induce(...)` throws `ProcedureInductionNotConfiguredError` and the tier stays pure offline CRUD.

## Background consolidator

A separate background process (`Consolidator`) distils long conversations into long-term knowledge. It runs in three phases with a built-in cost budget so it can never run away with your bill:

| Phase | What it does |
|---|---|
| **Light** | Summarisation, conflict-resolution flush of pending rows, and **multi-signal forgetting** — low-salience facts are soft-archived (recoverable). |
| **Standard** | **Neighbour-aware** semantic promotion + reconciliation, **episode formation with auto-importance scoring**, and (opt-in) `'llm'` contextual-retrieval enrichment. |
| **Deep** | Cross-session pattern detection, **reflection / insight synthesis**, procedural extraction, shared-tier promotion. |

Per-tier defaults from `CONSOLIDATOR_TIER_DEFAULTS`:

| Tier | Phases enabled | `maxTokensPerDay` | `maxCostPerDay` (USD) | `onExceed` |
|---|---|---|---|---|
| `'free'` (default) | `light` only | `0` (effectively no-op) | `0` | `'pause'` |
| `'cheap'` | `light + standard` | `50 000` | `0.20` | `'pause'` |
| `'standard'` | `light + standard + deep` | `200 000` | `1.00` | `'log'` |
| `'full'` | `light + standard + deep` | `1 000 000` | `5.00` | `'log'` |
| `'custom'` | operator-defined | operator must set | operator must set | operator must set |

Phase-level features are gated by per-tier flags: **episode formation** and **importance scoring** are on at `standard` / `full`; **contextual retrieval** defaults to `late-chunk` on every tier (the `'llm'` upgrade is consolidator-only); **reflection** is on **only at `full`**. The default `'free'` tier registers the `light` phase but pins both ceilings to zero, so consolidation effectively does nothing until you opt in:

```ts
createMemory({
  store: sqlite.memory,
  embeddings: sqlite.embeddings,
  embedder: createTransformersJsEmbedder(),
  consolidator: { tier: 'cheap', enabled: true, provider },
});
```

`'custom'` requires explicit `ceilings.maxTokensPerDay` + `ceilings.maxCostPerDay` (and `cheapModel` / `deepModel` if those phases are enabled) — `CustomTierMisconfiguredError` is thrown otherwise. The full `CONSOLIDATOR_TIER_DEFAULTS` table is exported from `@graphorin/memory`.

### Reflection & insight synthesis

At the `full` tier, once the accumulated importance of recent episodes crosses a threshold, the deep phase asks the model for the few most salient questions, retrieves evidence for each, and synthesises a higher-order **insight** (Generative Agents). Insights land `provenance: 'reflection'` + `status: 'quarantined'`, carry **mandatory citations set from the retrieved evidence** (never hallucinated), and are **rank-capped below the facts they cite**. Read them through `memory.insights.search` / `memory.insights.list`.

### Multi-signal forgetting

Forgetting is **cost / staleness control, not an accuracy lever**. The light phase scores each fact with `salience(...)` — the Ebbinghaus `retention` curve (recency + access frequency) combined with the fact's `importance` hint and a security-risk negative term (a quarantined or foreign-provenance fact is evicted sooner). With neutral importance on an active, first-party fact, `salience === retention`, so behaviour is unchanged until you opt in. Setting `decayCapacity` bounds storage: the lowest-salience facts are **soft-archived** (recoverable — `archived = 1`, never deleted) until the window fits.

```ts
createMemory({ /* … */ consolidator: { tier: 'standard', enabled: true, provider, decayCapacity: 50_000 } });
```

## Recall explainability

Ask *why* a memory surfaced. `explainRecall(hits, { query, rerankerId })` decomposes a `search(...)` result into the per-memory signals that drove its score — `bm25` / `vector` / fused `rrf` / `decay` — in final-rank order; `formatRecallExplanation(...)` renders it. `search` also attaches that breakdown (ids + scores + signals, never the query text) to the `memory.search.semantic` span.

Operators inspect the rest from the CLI — `graphorin memory inspect <factId>` (supersede chain / quarantine / conflicts / citing insights) and `graphorin memory activity` (recent consolidator / reflection activity). See the [CLI guide](/guide/cli#graphorin-memory).

## Embedder migration

Switching embedders silently is a footgun — old vectors are not comparable to new ones. The runner in `@graphorin/memory/migration` makes the change explicit:

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

| Strategy | Behaviour |
|---|---|
| `lock-on-first` (default) | Refuses any silent embedder swap with an actionable error pointing at the planned migration. |
| `multi-active` | Keeps both `vec0` tables alive — reads union, writes go to the active embedder. |
| `auto-migrate` | Re-embeds existing rows in resumable batches (checkpointed via `migration_state`; cancellable with `AbortSignal`). |

## Privacy levels

Every memory row carries a `Sensitivity` tag — `public`, `internal`, or `secret`. The tag flows through traces, exports, and the provider middleware. Sensitive content is redacted by default; you cannot accidentally turn redaction off. This is orthogonal to the [provenance / quarantine](#memory-safety-provenance-quarantine) trust gate above: sensitivity controls *who may see* a memory, provenance controls *whether it is trusted enough to recall*.

## Next steps

- [Rerankers & fusion](/guide/rerankers) — RRF, weighted fusion, and query transformation.
- [Security](/guide/security#memory-safety-provenance-quarantine) — the memory-poisoning threat model and the quarantine gate.
- [Agent runtime](/guide/agent-runtime) — how the runtime registers `memory.tools`.
- [Sessions](/guide/sessions) — multi-agent attribution + JSONL export + replay.
- [Persistence](/guide/persistence) — SQLite + `sqlite-vec` + FTS5, migrations, and the bi-temporal schema.
- [Observability](/guide/observability) — what the memory spans look like.

---

**Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko
