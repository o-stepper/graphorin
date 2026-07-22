[**Graphorin API reference v0.15.1**](../../index.md)

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
> Project Graphorin · v0.15.1 · MIT License · © 2026 Oleksiy Stepurenko ·
> <https://github.com/o-stepper/graphorin>

---

## Status

- **Published:** v0.15.1 (optional sub-pack)
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

### Known advisory: adm-zip via onnxruntime-node

`npm audit` flags a high advisory
([GHSA-xcpc-8h2w-3j85](https://github.com/advisories/GHSA-xcpc-8h2w-3j85))
in this package's chain:
`@huggingface/transformers -> onnxruntime-node -> adm-zip@0.5.x`.
`adm-zip` runs only inside `onnxruntime-node`'s install script to
unpack its own release archives - the runtime never parses foreign ZIP
files - and every current `onnxruntime-node` release pins the
vulnerable range, so no dependency bump resolves it today. Until
upstream moves, add the verified one-line override to your
application's root manifest (`npm audit --omit=dev` then comes back
clean; the install scripts and runtime work unchanged):

```jsonc
// npm / bun: package.json
{ "overrides": { "adm-zip": "^0.6.0" } }
```

```jsonc
// pnpm: package.json
{ "pnpm": { "overrides": { "adm-zip@<0.6.0": ">=0.6.0 <1" } } }
```

Full analysis in the
[security guide](https://docs.graphorin.com/guide/security); the
scheduled published-consumer audit tracks the advisory against a
reviewed allowlist and fails if the exposure ever widens.

### Known advisory: sharp under transformers.js

`npm audit` also flags a high advisory
([GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj))
in the chain `@huggingface/transformers -> sharp@0.34.x` (inherited
libvips image-decoding CVEs; patched in `sharp@0.35.0`). `sharp` is
transformers.js's image-input path - this package runs text-only
pipelines and never feeds image files through `sharp` - but upstream
pins `sharp ^0.34.5`, so no dependency bump resolves it today. Until
upstream widens the range, add the verified override next to the
`adm-zip` one (text pipelines and native loading work unchanged on
`sharp@0.35.3`):

```jsonc
// npm / bun: package.json
{ "overrides": { "sharp": "^0.35.0" } }
```

```jsonc
// pnpm: package.json
{ "pnpm": { "overrides": { "sharp@>=0.30.0 <0.35.0": ">=0.35.0 <0.36" } } }
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

**Project Graphorin** · v0.15.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/reranker-transformersjs/README.md) | @graphorin/reranker-transformersjs - cross-encoder reranker adapter for the Graphorin framework. |
| [package.json](/api/@graphorin/reranker-transformersjs/package.json/index.md) | - |
