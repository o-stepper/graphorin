[**Graphorin API reference v0.6.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/embedder-transformersjs

# @graphorin/embedder-transformersjs

> Default in-process embedder for the Graphorin framework.

`@graphorin/embedder-transformersjs` wraps `@huggingface/transformers@^4.1.0`
to produce dense embeddings inside the Graphorin process - no external
service, no network call after the first model download. The default
model is `Xenova/multilingual-e5-base` (768-dim, multilingual). Other
multilingual variants from the same family (`multilingual-e5-small`,
`multilingual-e5-large`, `bge-m3`) are first-class through the same
factory.

The package implements the `EmbedderProvider` contract from
`@graphorin/core/contracts`:

- `id()` - canonical id, e.g.
  `'transformersjs:Xenova/multilingual-e5-base@768'`.
- `dim()` - output vector dimensionality (resolved at first `embed`).
- `configHash()` - deterministic hex hash over canonical-JSON config.
- `embed(texts)` - batched, lazy. Returns one `Float32Array` per text.

## Install

```bash
pnpm add @graphorin/embedder-transformersjs @huggingface/transformers
```

## Quick start

```ts
import { createTransformersJsEmbedder } from '@graphorin/embedder-transformersjs';

const embedder = createTransformersJsEmbedder({
  model: 'Xenova/multilingual-e5-base',
  pooling: 'mean',
  normalize: true,
});

const [vec] = await embedder.embed(['Loves espresso.']);
console.log(embedder.id(), embedder.dim(), vec.length);
```

## E5 asymmetric prefixes

E5-family models (the default, and any model id carrying an `e5` token) require
asymmetric `query:` / `passage:` prefixes - omitting them measurably degrades
retrieval. The embedder applies them automatically: pass `taskType: 'query'`
when embedding a search query and `taskType: 'passage'` (the default) for stored
content. The Graphorin memory tiers thread this for you (`query` on search,
`passage` on `remember`).

> **Migration:** enabling the prefixes (the new default for E5) changes the
> embedder's `configHash`, and therefore its `id`. Under the default
> `lock-on-first` policy an existing index built before this change reports an
> embedder mismatch - run `graphorin memory migrate` to re-embed it, or pass
> `disableTaskPrefix: true` to keep the old (unprefixed) behaviour and id.

## Cache directory

The Hugging Face model cache lives under `os.homedir()/.cache/...` by
default. Override with the standard env var or pass it explicitly:

```bash
GRAPHORIN_CACHE_DIR=/var/lib/graphorin/models pnpm start
```

## Network behaviour

The embedder is **local-first**: the only outbound call is the first
model download (cached after success). The
`scripts/check-no-network.mjs` static guard explicitly allow-lists
`packages/embedder-*/` for this reason.

If the model cannot be downloaded (offline / corporate firewall), the
embedder throws an `EmbedderModelLoadError` with an actionable message:
the Phase 17 docs cover the offline-install procedure.

## License

MIT © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.6.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

@graphorin/embedder-transformersjs - default in-process embedder.

Wraps `@huggingface/transformers@^4.1.0` to produce dense embeddings
inside the Graphorin process. Default model
`Xenova/multilingual-e5-base` (768-dim, multilingual; DEC-130 /
ADR-025).

## Classes

| Class | Description |
| ------ | ------ |
| [EmbedderModelLoadError](/api/@graphorin/embedder-transformersjs/classes/EmbedderModelLoadError.md) | Raised when the underlying transformer model cannot be loaded (offline / corporate firewall / wrong cache dir). |
| [TransformersJsEmbedder](/api/@graphorin/embedder-transformersjs/classes/TransformersJsEmbedder.md) | `EmbedderProvider` implementation backed by `@huggingface/transformers`. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [TransformersJsEmbedderOptions](/api/@graphorin/embedder-transformersjs/interfaces/TransformersJsEmbedderOptions.md) | Configuration accepted by [createTransformersJsEmbedder](/api/@graphorin/embedder-transformersjs/functions/createTransformersJsEmbedder.md). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [FeatureExtractor](/api/@graphorin/embedder-transformersjs/type-aliases/FeatureExtractor.md) | Tiny structural shape of `@huggingface/transformers`' feature- extraction pipeline used by this package. Declared inline so the embedder does not import the heavy peer at build time. |
| [PipelineFactory](/api/@graphorin/embedder-transformersjs/type-aliases/PipelineFactory.md) | Pipeline-factory shape used for dependency injection in tests. |
| [Pooling](/api/@graphorin/embedder-transformersjs/type-aliases/Pooling.md) | Pooling strategy. Defaults to `'mean'` per the multilingual-e5 model card. |

## Variables

| Variable | Description |
| ------ | ------ |
| [VERSION](/api/@graphorin/embedder-transformersjs/variables/VERSION.md) | Canonical version constant. Mirrors the `package.json` version. |

## Functions

| Function | Description |
| ------ | ------ |
| [\_resetPipelineFactoryCacheForTesting](/api/@graphorin/embedder-transformersjs/functions/resetPipelineFactoryCacheForTesting.md) | Test-only cache reset. |
| [canonicalConfigHash](/api/@graphorin/embedder-transformersjs/functions/canonicalConfigHash.md) | Canonical-JSON deterministic hash of an embedder configuration. Object keys are sorted lexicographically; primitives flow through as `JSON.stringify` would render them. Used by the multi-table per- embedder vec0 layout to tell drift apart from a true model swap. |
| [createTransformersJsEmbedder](/api/@graphorin/embedder-transformersjs/functions/createTransformersJsEmbedder.md) | Build a `TransformersJsEmbedder` instance. Lazy: the underlying pipeline is constructed on the first `embed()` call so packaging the embedder does not pay the model-load cost. |
| [isE5Model](/api/@graphorin/embedder-transformersjs/functions/isE5Model.md) | True when a model id belongs to the E5 family, which requires asymmetric `query:` / `passage:` prefixes (PS-10). Matches an `e5` token bounded by a path / dash / underscore so it covers `multilingual-e5-base`, `e5-large`, `intfloat/e5-mistral`, etc. without false-matching unrelated names. |
