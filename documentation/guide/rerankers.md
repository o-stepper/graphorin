---
title: Rerankers
description: After memory retrieves candidates, a reranker reorders them by relevance before they enter the context window - a pluggable stage behind the ReRanker contract.
---

# Rerankers

After memory retrieves candidates, a **reranker** reorders them by relevance
to the query before they enter the context window. Rerankers implement the
`ReRanker` contract, so the stage is pluggable.

The runnable fragments below share one setup file - save it as `setup.ts` next
to the snippet you copy:

```ts file=setup.ts
import { createSqliteStore } from '@graphorin/store-sqlite';
import { createTransformersJsEmbedder } from '@graphorin/embedder-transformersjs';
import { createMemory } from '@graphorin/memory';
import { createProvider, ollamaAdapter } from '@graphorin/provider';
import type { SessionScope } from '@graphorin/core';

export const sqlite = await createSqliteStore({ path: './assistant.db' });
await sqlite.init();

export const embedder = createTransformersJsEmbedder();
export const provider = createProvider(ollamaAdapter({ model: 'qwen2.5:7b-instruct' }));
export const base = { store: sqlite.memory, embeddings: sqlite.embeddings, embedder };
export const memory = createMemory(base);
export const scope: SessionScope = { userId: 'alex' };
```

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
by its *kind* per call - `fts` and `vector`, plus `graph` / `entity` legs when
graph expansion or entity matching is enabled:

```ts
import { memory, scope } from './setup.js';

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
graph, entity` under `multiQuery`/`hyde`/`expandHops`/`entityMatch`), so position N no longer means
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
import { embedder, sqlite } from './setup.js';

const memory = createMemory({
  store: sqlite.memory,
  embeddings: sqlite.embeddings,
  embedder,
  reranker: createCrossEncoderReranker({ locale: 'en', batchSize: 32 }),
});
```

> [!WARNING]
> Like the transformers.js embedder, a fresh install of
> `@graphorin/reranker-transformersjs` currently reports one high
> `npm audit` advisory (install-script-only `adm-zip` exposure under
> `onnxruntime-node`); a one-line consumer override resolves it - see
> [published dependency-graph advisories](/guide/security#published-dependency-graph-advisories).

### Notes & tuning

- **`reranker-transformersjs`** validates `batchSize` at construction (a
  non-positive or non-integer value throws `RangeError`) and evicts the model
  after an idle window when `idleEvictionMs` is set. Lower `batchSize` if large
  passages pressure memory.
- **Precision & scoring** - the default precision is device-aware
  (`defaultRerankerDtype`): `'q8'` on CPU (the default device), `'fp16'` on
  accelerated devices; pass an explicit `dtype` to override. Scores are the
  raw cross-encoder logits passed through a sigmoid (the default BGE heads
  are single-logit), so relevant and irrelevant pairs separate cleanly.
- **`reranker-llm`** scores in batches (default `5`). The score parser
  deliberately accepts only a bare, whole-string integer reply
  (anti-prompt-injection hardening) - a verbose response like `Score: 7` is
  unparseable and falls back to a neutral score (`fallbackScore`, default `0`)
  rather than failing the whole query; tune this for your provider. The
  scoring prompt is English by default; pass a `scoringPrompt` builder for
  other locales.
- **Diagnostics** - after each `rerank(...)`, `lastErrorCount` counts provider
  failures that degraded to the fallback, `lastOffFormatCount` counts
  unparseable replies, and `lastFailures` holds per-passage detail (error
  class, HTTP status, off-format reply snippet; capped at 25 entries) so a
  degraded live ranking is diagnosable without re-running billed calls.
- **Live cloud usage** - the raw adapter retries nothing: a burst of
  `batchSize` cold scoring calls can trip provider rate limits (HTTP 429) and
  each such reject degrades one passage. For production and live probes,
  compose the provider with `withRetry` (and optionally `withRateLimit`) from
  `@graphorin/provider` before handing it to `createLlmReranker` - the
  reranker inherits the middleware transparently.
- **Reasoning models need output headroom** - the scorer asks for a bare
  integer, but a reasoning model (OpenAI `gpt-5.x`, o-series) burns hidden
  reasoning tokens against `maxOutputTokens` first; at the default-tight
  budgets an empty reply comes back and the passage degrades as off-format
  (observed live: `maxOutputTokens: 16` failed intermittently, `48` was
  reliably green). Give live reasoning-model rerankers
  `maxOutputTokens: 48` or more - `lastOffFormatCount` climbing with empty
  snippets in `lastFailures` is the signature of a too-tight budget.

## Query transformation

Reranking only helps if the right candidates were retrieved in the first place.
When the question and the stored fact use different words, **query
transformation** widens recall *before* fusion:

- **`multiQuery: N`** - rewrites the query into up to `N - 1` paraphrases
  (RAG-Fusion), retrieves each, and fuses every list through the reranker.
- **`hyde: true`** - embeds a *hypothetical answer* to the query
  ([HyDE](https://arxiv.org/abs/2212.10496)) and fuses its nearest neighbours.

```ts
import { createMemory } from '@graphorin/memory';
import { base, provider, scope } from './setup.js';

const memory = createMemory({ ...base, queryTransform: { provider } });

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
