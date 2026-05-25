---
title: Providers
description: One Provider interface for every LLM. Adapters for the Vercel AI SDK, Ollama, OpenAI-compatible servers, the llama.cpp HTTP server, and an in-process GGUF companion.
---

# Providers

Graphorin is **vendor-neutral by principle**. A single `Provider` interface adapts any LLM, and a middleware composer wires sensitivity-aware redaction, token counting, model-tier classification, and reasoning-policy enforcement into every call.

## Adapters

| Adapter | Backed by | Use when |
|---|---|---|
| `vercelAdapter(...)` | [Vercel AI SDK](https://github.com/vercel/ai) (`ai@^7.0.0-beta.76`, Apache-2.0) | A frontier cloud provider — OpenAI, Anthropic, Google, etc. |
| `ollamaAdapter(...)` | A local [Ollama](https://ollama.com/) daemon over HTTP. | Local-first deployments that already run an Ollama daemon. |
| `openAICompatibleAdapter(...)` | Any HTTP server speaking the OpenAI Chat Completions wire format. | LM Studio, LocalAI, vLLM, Together.ai, llama-server's OpenAI-compat mode, …  |
| `llamaCppServerAdapter(...)` | The standalone `llama-server` binary from [`llama.cpp`](https://github.com/ggml-org/llama.cpp). | When you want the canonical `llama.cpp` server but not in-process. |
| `createLlamaCppNodeAdapter(...)` (in `@graphorin/provider-llamacpp-node`) | [`node-llama-cpp@^3.5`](https://node-llama-cpp.withcat.ai/) (MIT). | In-process GGUF execution. Companion package (opt-in install). |

## Why a `Provider` and not the raw SDK?

`createProvider(adapter, options?)` wraps the raw adapter in the canonical `Provider` shape and centralises:

- per-instance `acceptsSensitivity` declarations,
- capability overrides (e.g. forcing `multimodal: false` for a tool that does not need it),
- default `reasoningRetention` resolution from the adapter's declared `reasoningContract`,
- a single attachment surface for every middleware below.

The optional middleware composer (`composeProviderMiddleware([...])`) wraps the result in a chain whose order is validated against the **canonical order** — outermost to innermost:

```text
withTracing → withRetry → withRateLimit → withCostLimit → withCostTracking → withFallback → withRedaction → adapter
```

A `MiddlewareOrderingError` is thrown the moment the array argument violates the canonical order, and a separate production-startup hook refuses to boot a server that does not include `withRedaction` in the chain. Each middleware has a focused responsibility:

| Middleware | What it does |
|---|---|
| `withTracing` | Attaches `provider.stream` spans through `@graphorin/observability`. |
| `withRetry` | Exponential backoff + jitter on transient failures. |
| `withRateLimit` | Per-bucket rate limiting before the request leaves the process. |
| `withCostLimit` | Refuses requests that would breach the configured budget. |
| `withCostTracking` | Records per-call cost for auditing. |
| `withFallback` | Composes a chain of fallback providers. |
| `withRedaction` | Innermost: strips secrets / PII immediately before the adapter call. |

Token counting, model-tier classification, and reasoning-retention policy are **separate APIs** (`createDefaultCounter(...)`, `classifyModelTier(...)`, `resolveReasoningRetention(...)`) — not middleware. They run as part of the agent runtime's per-step planning, not inside the middleware chain.

## Quick start

```ts
import { createProvider, ollamaAdapter } from '@graphorin/provider';

const provider = createProvider(
  ollamaAdapter({
    baseURL: 'http://127.0.0.1:11434',
    model: 'qwen2.5:7b-instruct-q4_K_M',
  }),
  {
    acceptsSensitivity: ['public', 'internal'],
    reasoningRetention: 'preserve',
  },
);
```

`acceptsSensitivity` is the **first-run sensitivity prompt**. Memory rows tagged `secret` are filtered out before any payload reaches the adapter. The default for an unfamiliar provider is **deny everything except `public`** until you opt in.

## Provider events

Every adapter normalises its native stream into the same `ProviderEvent` discriminated union:

| Event type | Meaning |
|---|---|
| `text.delta` | A token of the assistant message. |
| `tool.call.delta` / `tool.call.end` | Streaming tool calls. |
| `reasoning.delta` | A token of an extended-reasoning channel (e.g. `<thinking>`). |
| `usage` | A usage update — input / output / total tokens. |
| `finish` | The stream has completed; carries the `finishReason`. |
| `error` | A normalised, typed error. |

The agent runtime consumes this stream and emits its own `AgentEvent`s on top.

## Model tiers

```mermaid
flowchart LR
    A[Model spec or per-tool hint] --> R[Tier resolver]
    R -->|tier-map match| Concrete["Concrete Provider, e.g. gpt-4o-mini"]
    R -->|no map, but spec| Spec[Per-tool ModelSpec]
    R -->|fallthrough| Default[Agent's default Provider]
```

Declare a tier on a tool:

```ts
import { tool } from '@graphorin/tools';

export const heavyPlanner = tool({
  name: 'plan',
  preferredModel: 'smart',
  // …
});
```

Map tiers to concrete Providers on the agent:

```ts
const agent = createAgent({
  // …
  modelTierMap: {
    fast: createProvider(ollamaAdapter({ model: 'qwen2.5:1.5b' })),
    balanced: createProvider(ollamaAdapter({ model: 'qwen2.5:7b-instruct' })),
    smart: createProvider(vercelAdapter({ provider: 'openai', model: 'gpt-4o' })),
  },
});
```

The runtime walks the precedence ladder once per step:

```text
'prepare-step' > 'tier-map' | 'spec' > 'agent-preferred' > 'fallthrough-default'
```

## Reasoning retention

Some providers expose internal reasoning content (extended thinking, scratch pads). Graphorin's policy model lets you keep the trade-offs explicit:

| Mode | Behaviour |
|---|---|
| `'preserve'` | Round-trip reasoning into the next call (best for tool-use loops). |
| `'cache-internal'` | Keep reasoning local for the next call but redact it from traces. |
| `'strip'` | Drop reasoning entirely after the response. |

Handoffs always strip reasoning — `filters.stripReasoning()` is unconditional at the boundary.

## Adapters at a glance

### Vercel AI SDK

```ts
import { createProvider, vercelAdapter } from '@graphorin/provider';

const provider = createProvider(
  vercelAdapter({ provider: 'openai', model: 'gpt-4o' }),
  { acceptsSensitivity: ['public'] },
);
```

The Vercel AI SDK provides the underlying connection to OpenAI, Anthropic, Google, Mistral, Groq, Cohere, etc. Configure provider-specific options (API key resolution, base URL, headers) on the adapter.

### Ollama

```ts
import { ollamaAdapter, createProvider } from '@graphorin/provider';

const provider = createProvider(
  ollamaAdapter({
    baseURL: 'http://127.0.0.1:11434',
    model: 'qwen2.5:7b-instruct-q4_K_M',
  }),
  { acceptsSensitivity: ['public', 'internal'] },
);
```

### OpenAI-compatible HTTP

```ts
import { openAICompatibleAdapter, createProvider } from '@graphorin/provider';

const provider = createProvider(
  openAICompatibleAdapter({
    baseURL: 'http://127.0.0.1:1234/v1',
    apiKey: 'lm-studio',
    model: 'qwen2.5-7b-instruct',
  }),
  { acceptsSensitivity: ['public', 'internal'] },
);
```

### `llama.cpp` HTTP server

```ts
import { llamaCppServerAdapter, createProvider } from '@graphorin/provider';

const provider = createProvider(
  llamaCppServerAdapter({ baseURL: 'http://127.0.0.1:8080' }),
  { acceptsSensitivity: ['public', 'internal'] },
);
```

### In-process GGUF (companion package)

```ts
// pnpm add @graphorin/provider-llamacpp-node
import { createLlamaCppNodeAdapter } from '@graphorin/provider-llamacpp-node';
import { createProvider } from '@graphorin/provider';

const provider = createProvider(
  await createLlamaCppNodeAdapter({ modelPath: '/abs/path/qwen2.5-7b.Q4_K_M.gguf' }),
  { acceptsSensitivity: ['public', 'internal'] },
);
```

Trade-off: in-process loses durable mid-stream resume because the model context lives in the Node.js process — see the durable-resume table in [Quickstart](/guide/quickstart).

## Token counting

`@graphorin/provider/counters` ships a dispatcher with built-in counters for Anthropic and OpenAI / `tiktoken`-style models. Plug in a custom counter for any other backend:

```ts
import { registerTokenCounter } from '@graphorin/provider';

registerTokenCounter('my-vendor:my-model', (messages) => {
  // Implementation using your vendor's tokeniser.
  return computeTokenCount(messages);
});
```

## Pricing

`@graphorin/pricing` ships a bundled snapshot of LLM pricing data sourced from the public [`@pydantic/genai-prices`](https://github.com/pydantic/genai-prices) dataset (MIT). The snapshot is **never refreshed automatically** — call `graphorin pricing refresh` to update it on demand. See [Pricing](/reference/pricing) for the full lifecycle.

## Next steps

- [Memory system](/guide/memory-system) — how memory is filtered before it reaches the provider.
- [Observability](/guide/observability) — what spans the provider middleware emits.
- [Security](/guide/security) — sensitivity gating and the redaction layer.
- [Pricing](/reference/pricing) — bundled snapshot + refresh.

---

**Graphorin** · v0.4.0 · MIT License · © 2026 Oleksiy Stepurenko
