[**Graphorin API reference v0.6.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/embedder-ollama

# @graphorin/embedder-ollama

> First-class opt-in alternative embedder for the Graphorin framework.

`@graphorin/embedder-ollama` wraps the local Ollama HTTP API to produce
dense embeddings without the bundled-model overhead of
`@graphorin/embedder-transformersjs`. The package ships known output
dimensions for ten common Ollama embedding models out of the box
(`KNOWN_OLLAMA_MODEL_DIMS`); any other model works too by passing an
explicit `dim`:

| Model | Dim | Notes |
|---|---:|---|
| `nomic-embed-text` (default) | 768 | Multilingual; the de-facto Ollama default. |
| `mxbai-embed-large` | 1024 | Strong English; competitive with cloud peers. |
| `snowflake-arctic-embed` | 1024 | Strong English. |
| `snowflake-arctic-embed2` | 1024 | Multilingual successor to arctic-embed. |
| `bge-m3` | 1024 | Multilingual; same family also ships via the transformers.js adapter. |
| `bge-large` | 1024 | Strong English. |
| `embeddinggemma` | 768 | Multilingual (Google). |
| `paraphrase-multilingual` | 768 | Multilingual paraphrase family. |
| `all-minilm` | 384 | Compact English. |
| `granite-embedding` | 384 | Compact (IBM). |

Multi-size models (e.g. tags whose dimension depends on the `:0.6b` /
`:4b` / `:8b` variant) are deliberately omitted from the known-dims
map so an ambiguous bind fails loudly instead of baking a wrong width.

## Install

```bash
pnpm add @graphorin/embedder-ollama
```

The package has **no native peers**. It uses the standard `fetch`
API to talk to a running Ollama instance (default
`http://127.0.0.1:11434`).

## Quick start

```ts
import { createOllamaEmbedder } from '@graphorin/embedder-ollama';

const embedder = createOllamaEmbedder({
  model: 'nomic-embed-text',
  baseUrl: 'http://127.0.0.1:11434',
});

const [vec] = await embedder.embed(['Loves espresso.']);
console.log(embedder.id(), embedder.dim(), vec.length);
```

## Trust + privacy

The embedder itself performs no trust classification - it is a thin
client for whatever `baseUrl` you give it, and it never talks to
anything else. Point it at a loopback Ollama (`http://127.0.0.1:11434`,
the default) and embeddings never leave the machine. Trust
classification and sensitivity gating for LLM traffic live one layer
up, in `@graphorin/provider`'s `LocalProviderTrust` classifier; apply
the same judgement before pointing this embedder at a remote host.

## Versioning of `embedder_id`

The canonical id includes the Ollama model digest discovered via
`POST /api/show` at construction time. A model upgrade in the same
Ollama instance produces a different digest - and therefore a
different `embedder_id`. The default `lock-on-first` policy in
`@graphorin/store-sqlite` then fires the same migration path the
existing `transformersjs` swap takes.

## License

MIT © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.6.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

@graphorin/embedder-ollama - first-class opt-in alternative embedder
for the Graphorin framework. Wraps the local Ollama HTTP API.

## Classes

| Class | Description |
| ------ | ------ |
| [OllamaEmbedder](/api/@graphorin/embedder-ollama/classes/OllamaEmbedder.md) | `EmbedderProvider` implementation that talks to the Ollama HTTP API. |
| [OllamaEmbedderError](/api/@graphorin/embedder-ollama/classes/OllamaEmbedderError.md) | Raised when the Ollama HTTP API returns a non-2xx response. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [OllamaEmbedderOptions](/api/@graphorin/embedder-ollama/interfaces/OllamaEmbedderOptions.md) | Options accepted by [createOllamaEmbedder](/api/@graphorin/embedder-ollama/functions/createOllamaEmbedder.md). |

## Variables

| Variable | Description |
| ------ | ------ |
| [DEFAULT\_OLLAMA\_BASE\_URL](/api/@graphorin/embedder-ollama/variables/DEFAULT_OLLAMA_BASE_URL.md) | Default Ollama base URL. Operators that run Ollama on a non-default port pass an explicit `baseUrl`. |
| [DEFAULT\_OLLAMA\_MODEL](/api/@graphorin/embedder-ollama/variables/DEFAULT_OLLAMA_MODEL.md) | Default Ollama model. Matches the de-facto choice in the Ollama community for general-purpose multilingual embeddings. |
| [KNOWN\_OLLAMA\_MODEL\_DIMS](/api/@graphorin/embedder-ollama/variables/KNOWN_OLLAMA_MODEL_DIMS.md) | Model -> output-dimension hints used to seed the canonical id before the first `embed()` resolves the real width from a response. Only single-width families are listed; size-variant families (e.g. `qwen3-embedding`, whose dim depends on the `:0.6b` / `:4b` / `:8b` tag) are deliberately omitted so an ambiguous bind fails loudly rather than baking a wrong width (PS-11). |
| [VERSION](/api/@graphorin/embedder-ollama/variables/VERSION.md) | Canonical version constant. Mirrors the `package.json` version. |

## Functions

| Function | Description |
| ------ | ------ |
| [canonicalConfigHash](/api/@graphorin/embedder-ollama/functions/canonicalConfigHash.md) | Canonical-JSON deterministic hash over an embedder configuration. Object keys are sorted lexicographically so the resulting hash is stable across `JSON.stringify` reorderings. |
| [createOllamaEmbedder](/api/@graphorin/embedder-ollama/functions/createOllamaEmbedder.md) | Build an Ollama-backed embedder. The first `embed()` call issues a `POST /api/show` to capture the model digest; subsequent calls hit the embedding endpoint directly. |
