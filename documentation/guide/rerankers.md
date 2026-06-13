---
title: Rerankers
description: After memory retrieves candidates, a reranker reorders them by relevance before they enter the context window — a pluggable stage behind the ReRanker contract.
---

# Rerankers

After memory retrieves candidates, a **reranker** reorders them by relevance
to the query before they enter the context window. Rerankers implement the
`ReRanker` contract, so the stage is pluggable.

## The default: Reciprocal Rank Fusion (RRF)

Out of the box, memory fuses the FTS5 keyword ranking and the vector-search
ranking with **Reciprocal Rank Fusion** (`k = 60`). RRF needs no model, no
network, and no extra dependency — it is the always-on default and is usually
enough. Reach for a learned reranker only when you measure a relevance gain on
your own data.

## Weighted fusion

RRF treats the keyword ranking and the vector ranking as equally trustworthy.
Once you have labelled data — for example from the `@graphorin/evals` harness — a
**calibrated weighting** often does better. Weight each retriever's contribution
by its *kind* (FTS vs. vector) per call:

```ts
await memory.semantic.search(scope, 'where does anna live now', {
  fusion: { strategy: 'weighted', weights: { vector: 3, fts: 1 } },
});
```

This fuses through the built-in `WeightedRRFReranker`, scaling each candidate
list's reciprocal-rank contribution by its weight (a HyDE list counts as
`vector`). **RRF stays the default** — omit `fusion` (or pass `{ strategy: 'rrf' }`)
and behaviour is unchanged; *equal weights reproduce RRF exactly*, so weighting is
a safe, incremental lever. Weights default to `1`, and a missing or malformed
weight degrades to neutral rather than poisoning the ranking.

For offline weight tuning against your eval set, the pure
`fuseWeighted(lists, weights, k)` function and the `WeightedRRFReranker` class are
exported from `@graphorin/memory/search`; pass the reranker to `setReranker(...)`
or `createMemory({ reranker })` to make a calibrated weighting the default for
every query.

## Optional learned rerankers

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
  rather than failing the whole query — tune this for your provider. The
  scoring prompt is English by default; pass a `scoringPrompt` builder for
  other locales.

## Query transformation

Reranking only helps if the right candidates were retrieved in the first place.
When the question and the stored fact use different words, **query
transformation** widens recall *before* fusion:

- **`multiQuery: N`** — rewrites the query into up to `N − 1` paraphrases
  (RAG-Fusion), retrieves each, and fuses every list through the reranker.
- **`hyde: true`** — embeds a *hypothetical answer* to the query
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
recall — and fix recall (contextual retrieval / multi-query) *before* reaching
for a learned reranker, which only pays off on an already-high-recall candidate
set.

## Writing your own

Implement `ReRanker` and pass it as `reranker`. The contract receives the query
and the candidate records and returns them reordered with scores; the memory
facade handles everything else.
