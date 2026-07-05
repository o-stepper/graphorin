---
title: Troubleshooting
description: Common Graphorin issues and how to resolve them - install & runtime, storage, providers, memory, and the standalone server.
---

# Troubleshooting

Common issues and how to resolve them. If something here is missing, check the
[FAQ](/reference/faq) or open an issue.

## Install & runtime

**`Cannot find module '@graphorin/core'` during typecheck/build.**
Producer packages must be built before consumers typecheck against their
`dist/*.d.ts`. Use the turbo-aware aliases (`pnpm build`, `pnpm typecheck`),
not `pnpm -r ...`, so the `dependsOn: ["^build"]` ordering is honoured.

**`Zod` errors / "peer dependency missing".**
`zod` (`^3.23` or `^4`) is a required peer dependency for the tool builder.
Install it in the consuming app.

**Node version errors.**
Graphorin requires **Node 22+** and is ESM-only. Ensure your app is `"type":
"module"` (or uses `.mjs`).

## Providers & models

**A run hangs or never returns.**
Local providers can stall if the backend is down. The Ollama embedder and
`pricing.refreshPricing` enforce timeouts; for providers, configure
`withRetry` / `withCostLimit` and an `AbortSignal`. See [Providers](/guide/providers).

**`MissingProductionMiddlewareError` at startup.**
In production, `withRedaction` is required in the provider middleware chain
(fail-fast). Compose it via `composeProviderMiddleware` - it is enforced as the
innermost layer so retries/fallbacks always see redacted payloads.

**Token-cost numbers look off.**
When a native token counter is unavailable the provider layer falls back to a
heuristic counter and emits a one-time WARN per `(counter, model)`. Wire the
native counter (e.g. an API key for Anthropic) for exact accounting.

## Memory & search

**Vector search returns nothing / is disabled.**
No embedder is configured. Add one (see [Embedders](/guide/embedders)); without
it, memory uses keyword (FTS5) search only.

**"embedder id mismatch" on startup.**
You changed the embedder model/config under a `lock-on-first` policy. Either
restore the original embedder, switch to `multi-active` / `auto-migrate`, or
re-embed. See [Embedders](/guide/embedders#embedder-identity-migrations).

## Storage

**Startup blocks on a migration.**
Migrations run in a transaction at startup. For large databases, run them in a
staging copy first. A failed migration rolls back rather than half-applying.

**Encrypted DB won't open.**
Wrong passphrase or the cipher peer is missing. `@graphorin/store-sqlite-encrypted`
fails fast with `CipherPeerMissingError` rather than silently opening
unencrypted. Empty passphrases are rejected. See [Storage backends](/guide/storage).

## Server & security

**Server refuses to start: pepper required.**
Token auth requires a pepper at startup (resolved from a `SecretRef`). Weak /
placeholder peppers (e.g. a long single-character run) are rejected by the
weak-secret detector - generate one with `crypto.randomBytes(32)` or
`generatePepper()`.

**WebSocket upgrade fails in the browser.**
Browsers cannot set an `Authorization` header. Use the ticket flow: offer both
the `graphorin.protocol.v1` and a `ticket.<value>` subprotocol token. See
[Standalone server](/guide/standalone-server).

## Examples

**An example exits immediately / `GRAPHORIN_OFFLINE` error.**
Examples default to a deterministic `stub` recipe
(`GRAPHORIN_LLM_RECIPE=stub`). `local-stack-cli` needs a real Ollama daemon;
with `GRAPHORIN_OFFLINE=1` it fails fast with an actionable message and exit
code 2 - that is expected. See the [example apps](/guide/examples).
