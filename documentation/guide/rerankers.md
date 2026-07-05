---
title: Rerankers
description: After memory retrieves candidates, a reranker reorders them by relevance before they enter the context window - a pluggable stage behind the ReRanker contract.
---

# Rerankers

After memory retrieves candidates, a **reranker** reorders them by relevance
to the query before they enter the context window. Rerankers implement the
`ReRanker` contract, so the stage is pluggable.

## The default: Reciprocal Rank Fusion (RRF)

Out of the box, memory fuses the FTS5 keyword ranking and the vector-search
ranking with **Reciprocal Rank Fusion** (`k = 60`). RRF needs no model, no
network, and no extra dependency - it is the always-on default and is usually
enough. Reach for a learned reranker only when you measure a relevance gain on
your own data.

After fusion (and decay, when enabled), a **rank-time trust discount** applies:
quarantined-but-included rows are down-weighted by `1 - quarantine` (default
0.3x) and foreign-provenance rows (`tool` / `imported` / `reflection` /
`induction`) by `1 - foreignProvenance` (default 0.8x), reusing the eviction
path's `SalienceWeights`. First-party active facts keep factor `1`, so ordinary
rankings are unchanged - the discount only stops a poisoned or foreign memory
from outranking the user's own words on pure similarity (the MINJA
memory-poisoning defense). The factor appears as the `trust` signal on hits and
in `explainRecall`; pass `trustWeighting: 'off'` per call for inspector or
calibration paths.

## Weighted fusion

RRF treats the keyword ranking and the vector ranking as equally trustworthy.
Once you have labelled data - for example from the `@graphorin/evals` harness - a
**calibrated weighting** often does better. Weight each retriever's contribution
by its *kind* (FTS vs. vector) per call:

```ts
await memory.semantic.search(scope, 'where does anna live now', {
  fusion: { strategy: 'weighted', weights: { vector: 3, fts: 1 } },
});
```

This fuses through the built-in `WeightedRRFReranker`, scaling each candidate
list's reciprocal-rank contribution by its weight (a HyDE list counts as
`vector`). **RRF stays the default** - omit `fusion` (or pass `{ strategy: 'rrf' }`)
and behaviour is unchanged; *equal weights reproduce RRF exactly*, so weighting is
a safe, incremental lever. Weights default to `1`, and a missing or malformed
weight degrades to neutral rather than poisoning the ranking.

For offline weight tuning against labelled queries, use
`fitFusionWeights(cases, { grid, k })` from `@graphorin/memory/search`: give it
per-kind candidate lists (run your FTS and vector retrievers once per query)
plus the relevant ids, and it grid-searches the weights that maximize mean
nDCG@k - returning the plain-RRF baseline alongside, so you only adopt a
weighting that measurably wins. Feed the result to the per-call
`fusion: { strategy: 'weighted', weights }` option shown above.

::: warning Do not install a raw `WeightedRRFReranker` as the process default
`WeightedRRFReranker` takes a **positional** weights array. The built-in search
fans candidate lists out conditionally (`fts_0, vector_0, fts_1, …, hyde,
graph` under `multiQuery`/`hyde`/`expandHops`), so position N no longer means
"FTS" or "vector" - `search()` makes weights safe only by rebuilding a per-call
reranker from the *kind-keyed* `fusion.weights`. A fixed positional array
installed via `setReranker(...)` / `createMemory({ reranker })` silently
mis-assigns weights the moment any fan-out option is used; prefer the per-call
`fusion` option, which survives fan-out by construction.
:::

## Optional learned rerankers

When you outgrow fusion, reach for the **local cross-encoder first**
(`@graphorin/reranker-transformersjs`): pointwise cross-encoders dominate
LLM-as-judge reranking on every axis in published benchmarks (~0.74 vs 0.68
NDCG@10, ~12ms vs ~185ms per query, an order of magnitude cheaper), run fully
in-process after the one-time model download, and are deterministic. Reserve
`@graphorin/reranker-llm` for the cases a cross-encoder cannot express (bespoke
scoring instructions, non-text criteria).

| | `@graphorin/reranker-llm` | `@graphorin/reranker-transformersjs` |
|---|---|---|
| Mechanism | LLM-as-judge via a `Provider` | BGE cross-encoder, in-process |
| Default model | your configured provider model | `bge-reranker-base` (en) / `bge-reranker-v2-m3` (other locales) |
| Cost | one provider call per batch | local inference, no network after download |
| Best when | you already pay for a provider and want quality | you want local, deterministic reranking |

```ts
import { createMemory } from '@graphorin/memory';
import { createCrossEncoderReranker } from '@graphorin/reranker-transformersjs';

const memory = createMemory({
  store,
  embeddings: store.embeddings,
  embedder,
  reranker: createCrossEncoderReranker({ locale: 'en', batchSize: 32 }),
});
```

### Notes & tuning

- **`reranker-transformersjs`** validates `batchSize` at construction (a
  non-positive or non-integer value throws `RangeError`) and evicts the model
  after an idle window when `idleEvictionMs` is set. Lower `batchSize` if large
  passages pressure memory.
- **`reranker-llm`** scores in batches (default `5`). On an unparseable model
  response it falls back to a neutral score (`fallbackScore`, default `0`)
  rather than failing the whole query - tune this for your provider. The
  scoring prompt is English by default; pass a `scoringPrompt` builder for
  other locales.

## Query transformation

Reranking only helps if the right candidates were retrieved in the first place.
When the question and the stored fact use different words, **query
transformation** widens recall *before* fusion:

- **`multiQuery: N`** - rewrites the query into up to `N - 1` paraphrases
  (RAG-Fusion), retrieves each, and fuses every list through the reranker.
- **`hyde: true`** - embeds a *hypothetical answer* to the query
  ([HyDE](https://arxiv.org/abs/2212.10496)) and fuses its nearest neighbours.

```ts
await memory.semantic.search(scope, 'what does alex like to drink', {
  multiQuery: 3,
  hyde: true,
});
```

Both are **opt-in** and require a provider:
`createMemory({ queryTransform: { provider } })`. With no transformer configured
(the default) these options are silent no-ops and search stays offline +
single-shot. They add provider latency, so reserve them for retrieval-heavy
recall - and fix recall (contextual retrieval / multi-query) *before* reaching
for a learned reranker, which only pays off on an already-high-recall candidate
set.

## Writing your own

Implement `ReRanker` and pass it as `reranker`. The contract receives the query
and the candidate records and returns them reordered with scores; the memory
facade handles everything else.
