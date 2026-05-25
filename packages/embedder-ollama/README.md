# @graphorin/embedder-ollama

> First-class opt-in alternative embedder for the Graphorin framework.

`@graphorin/embedder-ollama` wraps the local Ollama HTTP API to produce
dense embeddings without the bundled-model overhead of
`@graphorin/embedder-transformersjs`. The package targets four models
out of the box:

| Model | Dim | Notes |
|---|---:|---|
| `nomic-embed-text` (default) | 768 | Multilingual; the de-facto Ollama default. |
| `mxbai-embed-large` | 1024 | Strong English; competitive with cloud peers. |
| `snowflake-arctic-embed` | 1024 | Strong English. |
| `bge-m3` | 1024 | Multilingual; same family also ships via the transformers.js adapter. |

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

The embedder operates against the same `LocalProviderTrust`
classifier as the Ollama LLM provider adapter (Phase 06). When
`baseUrl` resolves to a loopback host (`localhost`, `127.0.0.1`,
`::1`), the trust class is permanent `loopback` and accepts every
sensitivity tier (`'public'`, `'internal'`, `'secret'`). Remote /
private-network hosts trigger a one-time WARN per process and the
runtime caller may pass an explicit `acceptsSensitivity` override.

## Versioning of `embedder_id`

The canonical id includes the Ollama model digest discovered via
`POST /api/show` at construction time. A model upgrade in the same
Ollama instance produces a different digest — and therefore a
different `embedder_id`. The default `lock-on-first` policy in
`@graphorin/store-sqlite` then fires the same migration path the
existing `transformersjs` swap takes.

## License

MIT © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
