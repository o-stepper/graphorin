[**Graphorin API reference v0.4.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/reranker-transformersjs

# @graphorin/reranker-transformersjs

> Cross-encoder reranker adapter for the
> [Graphorin](https://github.com/o-stepper/graphorin) framework. Wraps
> [`@huggingface/transformers`](https://www.npmjs.com/package/@huggingface/transformers)
> to score `(query, passage)` pairs with a BGE cross-encoder running
> entirely in-process. Implements the `ReRanker` contract from
> `@graphorin/memory/search`.
>
> Project Graphorin · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.4.0 (optional sub-pack)
- **Default model:** locale-aware (`Xenova/bge-reranker-base` for
  English, `BAAI/bge-reranker-v2-m3` for everything else).
- **Default precision:** FP16 (`'fp16'` dtype).
- **Default device:** CPU.

---

## Install

```bash
pnpm add @graphorin/reranker-transformersjs @huggingface/transformers
```

The first call to `rerank(...)` lazily downloads the reranker weights
into the Hugging Face cache directory (`~/.cache/huggingface/hub` by
default; honours `GRAPHORIN_CACHE_DIR`). To pre-warm in CI:

```bash
node -e "import('@graphorin/reranker-transformersjs').then(m => m.createCrossEncoderReranker({ locale: 'en' }).rerank('warmup', [[]], {}))"
```

---

## Usage

### Drop-in replacement for the built-in RRF reranker

```ts
import { createMemory } from '@graphorin/memory';
import { createCrossEncoderReranker } from '@graphorin/reranker-transformersjs';

const memory = createMemory({
  store,
  embedder,
  reranker: createCrossEncoderReranker({ locale: 'en' }),
});
```

### Multilingual deployment

```ts
const reranker = createCrossEncoderReranker({
  locale: 'pt-BR',
  // Falls back to BAAI/bge-reranker-v2-m3 (568M, multilingual).
});
```

### Override the model explicitly

For narrow language-pair scenarios (e.g. CJK, low-resource European
languages) plug in a specialised cross-encoder of your choice:

```ts
const reranker = createCrossEncoderReranker({
  model: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
  dtype: 'q8',
});
```

### Idle eviction (bound resident memory)

```ts
// Drop the loaded ONNX session after 10 minutes of inactivity.
const reranker = createCrossEncoderReranker({
  locale: 'en',
  idleEvictionMs: 10 * 60 * 1000,
});
```

### Custom passage extractor

The default extractor walks `text → summary → value → label → id`.
Override when your custom `MemoryRecord` schema attaches the canonical
text elsewhere:

```ts
const reranker = createCrossEncoderReranker<MyRecord>({
  passageExtractor: (record) => `${record.title}. ${record.body}`,
});
```

---

## Acceptance criteria

- [x] Reranks fixture results.
- [x] Locale auto-pick verified (`'en' → bge-reranker-base`, every
      other locale → `bge-reranker-v2-m3`).
- [x] Lazy load + idle unload works.
- [x] Implements `ReRanker` from `@graphorin/memory/search`.

---

## Related decisions

- ADR-024 — Reciprocal Rank Fusion default + pluggable rerankers.

---

## License

MIT © 2026 Oleksiy Stepurenko

---

**Project Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

@graphorin/reranker-transformersjs — cross-encoder reranker adapter
for the Graphorin framework.

Wraps `@huggingface/transformers@^4.1.0` to score `(query, passage)`
pairs in-process. Plug into the memory hybrid-search pipeline as a
drop-in replacement for the built-in `RRFReranker`:

```ts
import { createMemory } from '@graphorin/memory';
import { createCrossEncoderReranker } from '@graphorin/reranker-transformersjs';

const memory = createMemory({
  store,
  embedder,
  reranker: createCrossEncoderReranker({ locale: 'en' }),
});
```

Locale-aware default model:

 - `'en'` / `'en-*'` → `Xenova/bge-reranker-base` (278M parameters,
   FP16 quantized).
 - Every other locale → `BAAI/bge-reranker-v2-m3` (568M parameters,
   multilingual baseline).

Operators that want a narrower / language-specific cross-encoder
pass an explicit `model` option — the package's defaults
deliberately avoid privileging any single language pair.

## Classes

| Class | Description |
| ------ | ------ |
| [CrossEncoderLoadError](/api/@graphorin/reranker-transformersjs/classes/CrossEncoderLoadError.md) | Raised when the `@huggingface/transformers` peer is missing or the configured cross-encoder model fails to load. |
| [TransformersJsReRanker](/api/@graphorin/reranker-transformersjs/classes/TransformersJsReRanker.md) | `ReRanker` implementation. Matches the contract from `@graphorin/memory/search`. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ClassifierResult](/api/@graphorin/reranker-transformersjs/interfaces/ClassifierResult.md) | Output shape returned by `@huggingface/transformers`' text-classification pipeline. Each pair returns either a single `{ label, score }` object (top-k = 1) or an array of them. We normalise on the array form upstream so the cross-encoder always sees a consistent shape. |
| [CrossEncoderRerankerOptions](/api/@graphorin/reranker-transformersjs/interfaces/CrossEncoderRerankerOptions.md) | Options accepted by [createCrossEncoderReranker](/api/@graphorin/reranker-transformersjs/functions/createCrossEncoderReranker.md). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [CrossEncoderPipeline](/api/@graphorin/reranker-transformersjs/type-aliases/CrossEncoderPipeline.md) | - |
| [CrossEncoderPipelineFactory](/api/@graphorin/reranker-transformersjs/type-aliases/CrossEncoderPipelineFactory.md) | - |
| [LocaleTag](/api/@graphorin/reranker-transformersjs/type-aliases/LocaleTag.md) | BCP 47 locale tag (e.g. `'en'`, `'en-GB'`, `'pt-BR'`, `'zh-Hans-CN'`). |
| [PassageExtractor](/api/@graphorin/reranker-transformersjs/type-aliases/PassageExtractor.md) | Caller-supplied passage extractor. Receives the record + the surrounding metadata (kind, sensitivity, tags) and returns the passage to feed into the cross-encoder. |
| [RerankerDtype](/api/@graphorin/reranker-transformersjs/type-aliases/RerankerDtype.md) | Numeric dtype hint. Default `'fp16'` per Phase 16 § `@graphorin/reranker-transformersjs`. |

## Variables

| Variable | Description |
| ------ | ------ |
| [DEFAULT\_ENGLISH\_MODEL](/api/@graphorin/reranker-transformersjs/variables/DEFAULT_ENGLISH_MODEL.md) | - |
| [DEFAULT\_MULTILINGUAL\_MODEL](/api/@graphorin/reranker-transformersjs/variables/DEFAULT_MULTILINGUAL_MODEL.md) | - |
| [RERANKER\_ID](/api/@graphorin/reranker-transformersjs/variables/RERANKER_ID.md) | - |
| [VERSION](/api/@graphorin/reranker-transformersjs/variables/VERSION.md) | Canonical version constant. Mirrors the `package.json` version. |

## Functions

| Function | Description |
| ------ | ------ |
| [\_resetPipelineFactoryCacheForTesting](/api/@graphorin/reranker-transformersjs/functions/resetPipelineFactoryCacheForTesting.md) | Test-only helper. Drops the cached pipeline factory so the next loader call re-imports the peer. |
| [createCrossEncoderReranker](/api/@graphorin/reranker-transformersjs/functions/createCrossEncoderReranker.md) | Build a cross-encoder reranker. Lazy: the pipeline is constructed on the first `rerank()` call so packaging the reranker pays no model-load cost. |
| [defaultPassageExtractor](/api/@graphorin/reranker-transformersjs/functions/defaultPassageExtractor.md) | Returns the best-effort passage text for a [MemoryRecord](/api/@graphorin/core/interfaces/MemoryRecord.md). The order of preference, top-down: |
| [extractPairScores](/api/@graphorin/reranker-transformersjs/functions/extractPairScores.md) | Normalises the raw pipeline output to a flat `score[]` aligned with the input pair order. Cross-encoder classifiers return either a single-best `{label, score}` per pair or an array of `topk` entries — we collapse on the highest-scoring positive label. |
| [loadDefaultPipelineFactory](/api/@graphorin/reranker-transformersjs/functions/loadDefaultPipelineFactory.md) | - |
| [mergeAndDedupe](/api/@graphorin/reranker-transformersjs/functions/mergeAndDedupe.md) | Merge the per-source lists into a single deduplicated array, preserving the **highest** initial score per record id and the **first-seen order** for stable tie-breaking. Pure function; exported for the unit test fixture. |
| [pickRerankerModel](/api/@graphorin/reranker-transformersjs/functions/pickRerankerModel.md) | Pick a reranker model from the agent locale. Pure function so callers (and tests) can pre-resolve the choice without constructing the reranker. |
