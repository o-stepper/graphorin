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

## Writing your own

Implement `ReRanker` and pass it as `reranker`. The contract receives the query
and the candidate records and returns them reordered with scores; the memory
facade handles everything else.
