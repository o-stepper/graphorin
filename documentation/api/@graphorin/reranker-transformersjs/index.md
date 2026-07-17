[**Graphorin API reference v0.12.0**](../../index.md)

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
> Project Graphorin · v0.12.0 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.12.0 (optional sub-pack)
- **Default model:** locale-aware (`Xenova/bge-reranker-base` for
  English, `BAAI/bge-reranker-v2-m3` for everything else).
- **Default precision:** device-aware (`defaultRerankerDtype`) - `'q8'`
  on CPU, `'fp16'` on accelerated devices such as `'webgpu'`. The fp16
  ONNX exports of the default models fail session initialisation on the
  onnxruntime-node CPU execution provider, so fp16 is not offered as a
  CPU default; pass an explicit `dtype` to override.
- **Default device:** CPU.
- **Scoring:** raw `AutoModelForSequenceClassification` logits -
  sigmoid for single-logit heads (the default BGE exports), positive
  label softmax probability for multi-logit heads. The
  text-classification pipeline is deliberately bypassed: it softmaxes
  each row, which collapses a single-logit head to a constant `1.0`
  for every pair. Injected `pipelineFactory` stubs keep the
  classifier-pipeline contract.

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

- ADR-024 - Reciprocal Rank Fusion default + pluggable rerankers.

---

## License

MIT © 2026 Oleksiy Stepurenko

---

**Project Graphorin** · v0.12.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/reranker-transformersjs/README.md) | @graphorin/reranker-transformersjs - cross-encoder reranker adapter for the Graphorin framework. |
| [package.json](/api/@graphorin/reranker-transformersjs/package.json/index.md) | - |
