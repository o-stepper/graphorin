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

**Project Graphorin** · v0.13.8 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
