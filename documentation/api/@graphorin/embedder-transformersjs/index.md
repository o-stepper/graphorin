[**Graphorin API reference v0.13.13**](../../index.md)

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

**Project Graphorin** · v0.13.13 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/embedder-transformersjs/README.md) | @graphorin/embedder-transformersjs - default in-process embedder. |
| [package.json](/api/@graphorin/embedder-transformersjs/package.json/index.md) | - |
