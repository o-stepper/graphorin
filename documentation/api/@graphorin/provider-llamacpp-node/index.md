[**Graphorin API reference v0.6.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/provider-llamacpp-node

# `@graphorin/provider-llamacpp-node`

> Companion package to
> [`@graphorin/provider`](/api/@graphorin/provider/index.md) - in-process GGUF
> execution for the
> [**Graphorin**](https://github.com/o-stepper/graphorin) framework.

Wraps `node-llama-cpp@^3.5` to load `.gguf` model files directly into
the same Node process. No daemon, no port to manage, no GPU contention
with other processes. Trust class is permanent `loopback` because the
model lives in the same trust boundary as the host process.

## Installation

```bash
pnpm add @graphorin/provider-llamacpp-node node-llama-cpp
```

## Quick start

```ts
import { llamaCppNodeAdapter } from '@graphorin/provider-llamacpp-node';
import { createProvider } from '@graphorin/provider';

const provider = createProvider(
  llamaCppNodeAdapter({
    modelPath: '/path/to/qwen2.5-7b-instruct-q4_k_m.gguf',
    gpuLayers: 'auto',
  }),
);
```

## Native token counting

```ts
import { LlamaCppNativeCounter } from '@graphorin/provider-llamacpp-node';
import { setGlobalTokenCounter } from '@graphorin/provider/counters';

setGlobalTokenCounter(
  new LlamaCppNativeCounter({
    model: loadedGgufModel,
    modelPath: '/path/to/qwen2.5-7b.gguf',
  }),
);
```

The counter wraps the GGUF tokenizer directly, which is strictly
tighter than the cl100k_base proxy used by the HTTP-shaped adapters.

## HITL durable-resume tradeoff

The in-process adapter does **not** survive a process restart
mid-stream - the model context lives in the running process and is
lost on exit. For human-in-the-loop workflows that need durable
mid-stream resume across restarts, prefer one of the HTTP-shaped
adapters instead:

- `ollamaAdapter` - Ollama HTTP daemon
- `llamaCppServerAdapter` - upstream `llama-server` binary
- `openAICompatibleAdapter` - LMStudio / LocalAI / vLLM /
  Together-style endpoints

## GGUF model provenance

`.gguf` model files are not signed by default. Pull only from trusted
publishers and verify the SHA-256 of the downloaded file against the
publisher's manifest:

- `huggingface.co/ggml-org`
- `huggingface.co/TheBloke`
- `huggingface.co/bartowski`
- `huggingface.co/unsloth`
- `huggingface.co/Qwen` (official Qwen distributions)

Full provenance enforcement (allowlist + Sigstore signature
verification) is a future Graphorin work item; v0.1 documents the
discipline rather than enforcing it at runtime.

## Project metadata

- **Project Graphorin** · v0.6.0 · MIT License · © 2026 Oleksiy Stepurenko
- Repository: <https://github.com/o-stepper/graphorin>

@graphorin/provider-llamacpp-node - in-process GGUF execution
adapter for the Graphorin framework. The package wraps
`node-llama-cpp@^3.5` to load `.gguf` model files directly into the
same Node process - no daemon, no port to manage, no GPU contention
with other processes.

The adapter declares `trust: 'loopback'` permanently because the
model lives in the same trust boundary as the host process; the
symmetry mirrors `@graphorin/embedder-transformersjs` (in-process
embedder; same trust boundary).

The companion package is operationally simpler than the HTTP-shaped
adapters but does NOT survive a process restart mid-stream - the
model context lives in the process and is lost on exit. For HITL
durable mid-stream resume, one of the HTTP-shaped adapters
(`ollamaAdapter`, `llamaCppServerAdapter`, `openAICompatibleAdapter`)
is the better choice.

## Classes

| Class | Description |
| ------ | ------ |
| [LlamaCppNativeCounter](/api/@graphorin/provider-llamacpp-node/classes/LlamaCppNativeCounter.md) | Counter that delegates to `model.tokenize(text)` from the loaded GGUF instance. Cache invalidation is keyed on the model file path (when supplied) so swapping models invalidates per-message caches upstream. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [LlamaCppNativeCounterOptions](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNativeCounterOptions.md) | Options for [LlamaCppNativeCounter](/api/@graphorin/provider-llamacpp-node/classes/LlamaCppNativeCounter.md). |
| [LlamaCppNodeAdapterOptions](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNodeAdapterOptions.md) | Options accepted by [llamaCppNodeAdapter](/api/@graphorin/provider-llamacpp-node/functions/llamaCppNodeAdapter.md). |
| [LlamaCppNodeRuntimeOverrides](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaCppNodeRuntimeOverrides.md) | Test-only shape for injecting fixture-driven runtime behaviour. |
| [LlamaInstance](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaInstance.md) | `Llama` engine instance (returned by `getLlama()`). |
| [LlamaModelInstance](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaModelInstance.md) | Loaded GGUF model. |
| [LlamaSessionInstance](/api/@graphorin/provider-llamacpp-node/interfaces/LlamaSessionInstance.md) | Loaded chat session capable of streaming responses. |

## Variables

| Variable | Description |
| ------ | ------ |
| [VERSION](/api/@graphorin/provider-llamacpp-node/variables/VERSION.md) | Canonical version constant. Mirrors the `package.json` version. |

## Functions

| Function | Description |
| ------ | ------ |
| [llamaCppNodeAdapter](/api/@graphorin/provider-llamacpp-node/functions/llamaCppNodeAdapter.md) | Build a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md) backed by an in-process GGUF model. The first call lazily loads the `node-llama-cpp` peer + the model file; subsequent calls reuse the cached instances. |
