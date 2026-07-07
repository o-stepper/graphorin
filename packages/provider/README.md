# `@graphorin/provider`

> Vendor-neutral LLM provider layer for the
> [**Graphorin**](https://github.com/o-stepper/graphorin) framework.

The package owns four moving parts:

1. **`createProvider(...)`** - wraps any adapter in a stable `Provider`
   shape with sensitivity, capability, and reasoning-retention defaults.
2. **Adapters** - `vercelAdapter` (default cloud path; wraps the Vercel
   AI SDK), `ollamaAdapter` (direct Ollama HTTP), `llamaCppServerAdapter`
   (the upstream `llama-server` binary from llama.cpp), and
   `openAICompatibleAdapter` (LMStudio / LocalAI / vLLM / Together-style
   self-host endpoints). Prompt caching: when a request carries
   `cachePolicy: { breakpoints: 'auto' }`, the vercel adapter anchors
   Anthropic `cache_control` breakpoints on the stable conversation
   prefix, and cache read / write token legs flow back through
   `Usage.cachedReadTokens` / `cacheWriteTokens`.
3. **Middleware** - `composeProviderMiddleware([...])` enforces a
   canonical order at startup and throws `MiddlewareOrderingError` on
   violation. Built-ins: `withTracing`, `withRetry`, `withRateLimit`,
   `withCostLimit`, `withCostTracking` (cache-aware: bills cache reads
   and writes at their own rates), `withFallback`, and
   `withRedaction` (mandatory in production).
4. **Token counting** - pluggable `TokenCounter` dispatcher. Default
   `JsTiktokenCounter` for OpenAI-compatible models; per-vendor native
   counters for Anthropic, Google, and Bedrock; heuristic fallback for
   unknown providers with a one-time WARN.

## Installation

```bash
pnpm add @graphorin/provider
# Optional peer for the cloud adapter:
pnpm add ai
# Optional peer for the default token counter:
pnpm add js-tiktoken
```

For the in-process llama.cpp companion adapter, install the separate
package:

```bash
pnpm add @graphorin/provider-llamacpp-node node-llama-cpp
```

## Quick start

```ts
import { composeProviderMiddleware, createProvider } from '@graphorin/provider';
import { vercelAdapter } from '@graphorin/provider/adapters/vercel';
import {
  withCostLimit,
  withFallback,
  withRateLimit,
  withRedaction,
  withRetry,
  withTracing,
} from '@graphorin/provider/middleware';
import { BUILT_IN_PATTERNS } from '@graphorin/observability/redaction/patterns';
import { openai } from '@ai-sdk/openai';

const provider = createProvider(vercelAdapter(openai('gpt-4o')));

const safeProvider = composeProviderMiddleware([
  withTracing(),
  withRetry({ maxRetries: 3 }),
  withRateLimit({ requestsPerMinute: 60 }),
  withCostLimit({ maxPerSession: 1.0 }),
  withFallback([fallbackProvider]),
  withRedaction({ patterns: BUILT_IN_PATTERNS }), // INNERMOST
])(provider);
```

## Local-first stack

```ts
import { ollamaAdapter } from '@graphorin/provider/adapters/ollama';

// Auto-classified as 'loopback' - no warning, no first-run prompt.
const local = createProvider(
  ollamaAdapter({ model: 'llama3.1:8b', baseUrl: 'http://127.0.0.1:11434' }),
);
```

The same `LocalProviderTrust` classifier (`'loopback' | 'private' |
'public-tls' | 'public-cleartext'`) drives the trust auto-detection,
the sensitivity-tier defaults, and the `withRedaction` policy table
for every `baseUrl`-driven adapter - `ollamaAdapter`,
`llamaCppServerAdapter`, and `openAICompatibleAdapter`. The classifier
lives at `@graphorin/provider/trust`. Public-cleartext URLs refuse to
start with `LocalProviderInsecureTransportError`.

## Cost-tier vocabulary

```ts
import type { ModelHint } from '@graphorin/core';
import { classifyModelTier } from '@graphorin/provider/model-tier';

classifyModelTier(provider); // ⇒ 'fast' | 'balanced' | 'smart' | undefined
```

The classifier is consumed by the agent runtime (Phase 12) to validate
operator-supplied per-tier mappings and to surface tier-not-mapped
recommendations.

## Project metadata

- **Project Graphorin** · v0.7.0 · MIT License · © 2026 Oleksiy Stepurenko
- Repository: <https://github.com/o-stepper/graphorin>
