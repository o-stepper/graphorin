---
title: Embedders
description: Embedders turn text into dense vectors for semantic memory search via the EmbedderProvider contract - local Transformers.js / Ollama backends, dimension locking, and migration.
---

# Embedders

An **embedder** turns text into a dense vector so memory can do semantic
(vector) search alongside the FTS5 keyword index. Embedders implement the
`EmbedderProvider` contract from `@graphorin/core/contracts`, so the rest of
the framework never depends on a specific backend.

Embedders are **opt-in**. With no embedder configured, vector search is
disabled and memory falls back to keyword search only.

```ts no-check
import { createMemory } from '@graphorin/memory';
import { createOllamaEmbedder } from '@graphorin/embedder-ollama';

const memory = createMemory({
  store,
  embeddings: store.embeddings,
  embedder: createOllamaEmbedder({ model: 'nomic-embed-text' }),
});
```

## Choosing a backend

| | `@graphorin/embedder-ollama` | `@graphorin/embedder-transformersjs` |
|---|---|---|
| Runs where | A local **Ollama daemon** over HTTP | **In-process** (`@huggingface/transformers`) |
| Default model | `nomic-embed-text` (768d) | `Xenova/multilingual-e5-base` (768d) |
| First-call cost | HTTP round-trip + `/api/show` digest probe | One-time model download, then cached |
| Best when | Ollama is already part of your stack | You want zero external services |
| Network | Localhost HTTP to the daemon | Model download on first use (then offline) |

Both are first-class, MIT-licensed, and privacy-respecting: the only network
traffic is to the local Ollama daemon or the one-time Hugging Face model
download. See [Privacy & no-phone-home](/guide/privacy).

## Configuration

### Ollama

```ts
import { createOllamaEmbedder } from '@graphorin/embedder-ollama';

createOllamaEmbedder({
  model: 'nomic-embed-text',
  baseUrl: 'http://127.0.0.1:11434', // default
  timeoutMs: 30_000,                 // per-request hard timeout (default)
});
```

`timeoutMs` aborts any `/api/show`, `/api/embed`, or legacy `/api/embeddings`
call that the daemon does not answer in time, so a hung daemon never stalls a
memory write. Set `timeoutMs: 0` to disable. A per-call `signal` (passed by the
runtime) is combined with the timeout.

### Transformers.js

```ts
import { createTransformersJsEmbedder } from '@graphorin/embedder-transformersjs';

createTransformersJsEmbedder({
  model: 'Xenova/multilingual-e5-base',
  cacheDir: process.env.GRAPHORIN_CACHE_DIR, // honoured automatically
});
```

Set `GRAPHORIN_CACHE_DIR` to control where models are cached and to
pre-stage them in offline / air-gapped deployments (download once on a
networked machine, copy the cache, run offline thereafter).

## Embedder identity & migrations

Each embedder reports a stable canonical id (`id()`) derived from its
model + config (for Ollama, including the resolved model digest). Memory keys
vector rows by that id, so swapping models or upgrading the underlying model
triggers the configured migration policy rather than silently mixing
incompatible vectors:

- **`lock-on-first`** (the default) - the first embedder id wins; registering a
  different one refuses to start until you migrate.
- **`multi-active`** - multiple embedder ids coexist (read across, write to the
  active one).
- **`auto-migrate`** - re-embed existing rows into the new id batch by batch via
  the migration runner (`migrateEmbedder(...)` from `@graphorin/memory/migration`,
  or the resumable `graphorin memory migrate` CLI form - see the
  [CLI guide](/guide/cli#graphorin-memory)), then retire the old id.

The index version key covers more than the model: the registry records the
**write-path contextualization mode** (`contextualRetrieval`, plus the
consolidator's opt-in `llm` enrichment) alongside the embedder's `configHash`.
Switching the mode changes the text that gets embedded, so it invalidates the
index exactly like a model change and trips the same policy. Databases created
before the mode was recorded adopt the current mode on their next start
instead of failing retroactively.

When the configured embedder is incompatible with the existing index
(different `configHash`, a `lock-on-first` conflict, or a contextualization
mode switch), `createMemory({ onIncompatibleEmbedder })` picks the failure
mode: `'fail'` (default) refuses to start with the actionable error, while
`'fts-only'` degrades - the embedder is dropped for the process, semantic
search serves keyword (FTS5) results only, writes store no vectors, and a
WARN plus an `x.memory.embedder-incompatible` span point at
`graphorin memory migrate`. The stored vectors stay untouched (stale) until
an explicit migration. For an always-on assistant the degraded mode keeps
memory serving instead of crash-looping on startup.

See the [Memory system](/guide/memory-system) guide for how vector search,
the RRF fusion step, and [rerankers](/guide/rerankers) fit together.
