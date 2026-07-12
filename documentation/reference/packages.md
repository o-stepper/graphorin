---
title: Packages
description: Every @graphorin/* package, with a one-line summary, scope, and stability status.
---

# Packages

Graphorin is published as a set of focused packages on the npm registry under the `@graphorin/*` scope. Packages are released **lockstep** at the same version while the framework is on the `0.x` line. Optional packages and adapters are versioned independently from the core lockstep release once the framework reaches `1.0`.

::: tip
Looking for the auto-generated TypeScript signatures? See the [API reference](/api/).
:::

<FrameworkBadge />

## Tier 0 - Foundation

| Package | Status | Role |
|---|---|---|
| [`@graphorin/core`](/api/) | stable | Core types, contracts, errors, ESM-only utilities. Dependency-free root every other `@graphorin/*` package depends on. |

## Tier 1 - Cross-cutting infrastructure

| Package | Status | Role |
|---|---|---|
| `@graphorin/security` | stable | `SecretValue`, `SecretRef`, OS keychain, audit log, server-token auth, OAuth 2.1, sandbox tiers, supply chain. |
| `@graphorin/observability` | stable | Tracing, redaction, eval interfaces. |
| `@graphorin/pricing` | stable | Bundled LLM pricing snapshot + opt-in refresh. |

## Tier 2 - Persistence + Provider

| Package | Status | Role |
|---|---|---|
| `@graphorin/store-sqlite` | stable | Default storage adapter on top of `better-sqlite3` + `sqlite-vec` + FTS5. |
| `@graphorin/embedder-transformersjs` | stable | Default in-process embedder (multilingual). |
| `@graphorin/embedder-ollama` | stable | First-class opt-in embedder against an Ollama daemon. |
| `@graphorin/triggers` | stable | Background tasks - cron / interval / idle / event. |
| `@graphorin/provider` | stable | `Provider` interface and adapters (Vercel AI SDK, Ollama, OpenAI-compatible, llama.cpp HTTP server). |
| `@graphorin/provider-llamacpp-node` | stable | Companion package - in-process GGUF execution. |

## Tier 3 - External surface

| Package | Status | Role |
|---|---|---|
| `@graphorin/tools` | stable | Typed tool definitions and execution. |
| `@graphorin/skills` | stable | Loader for the public Agent Skills `SKILL.md` packaging format with three-tier progressive disclosure. |
| `@graphorin/mcp` | stable | Model Context Protocol client (stdio + Streamable HTTP). |
| `@graphorin/channels` | stable | Channel SPI + gateway runtime for messenger front doors - identity routing, pairing, trust boundary, testkit. Ships no vendor adapters. |

## Tier 4 - Memory & Sessions

| Package | Status | Role |
|---|---|---|
| `@graphorin/memory` | stable | Six-tier memory (+ derived insights): hybrid search with weighted fusion, an entity graph with one-hop expansion, bi-temporal time-travel, a provenance/quarantine safety gate, plus the multi-stage conflict pipeline and consolidator. |
| `@graphorin/sessions` | stable | Hybrid session facade, agent registry, handoffs, JSONL export, replay reconstruction. |

## Tier 5 - Runtime

| Package | Status | Role |
|---|---|---|
| `@graphorin/agent` | stable | Agent runtime - typed `model -> tool calls -> model` loop, streaming events, durable HITL, multi-agent handoffs, fan-out, evaluator-optimizer. |
| `@graphorin/workflow` | stable | Durable step-graph runtime with checkpoints, `pause` / `resume`, `Dispatch`, channel kinds. |

## Tier 6 - Standalone server + DX

| Package | Status | Role |
|---|---|---|
| `@graphorin/server` | stable | Optional standalone server with REST + WebSocket + SSE fallback. |
| `@graphorin/cli` | stable | Operator CLI. |
| `@graphorin/protocol` | stable | WebSocket protocol contract - `graphorin.protocol.v1`. |
| `@graphorin/client` | stable | Browser-friendly client for the standalone server. |

## Optional packages

| Package | Status | Role |
|---|---|---|
| `@graphorin/store-sqlite-encrypted` | optional | SQLCipher v4 encryption-at-rest. |
| `@graphorin/secret-1password` | optional | Reference adapter for the 1Password CLI. |
| `@graphorin/reranker-transformersjs` | optional | Cross-encoder reranker via `@huggingface/transformers`. |
| `@graphorin/reranker-llm` | optional | LLM-judge reranker. |
| `@graphorin/eslint-plugin` | optional | ESLint rules for projects that build on Graphorin. |
| `@graphorin/evals` | optional | Eval framework - scorers, dataset loaders, reporters, parallel runner, regression detection (builds on the eval primitives in `@graphorin/observability`). |

## Direct dependencies

For the canonical list of third-party libraries Graphorin depends on (with versions, SPDX licenses, and the role each plays), see [Third-party notices](/contributing/third-party-notices). The most prominent runtime dependencies:

| Library | License | Role |
|---|---|---|
| [`ai`](https://github.com/vercel/ai) (Vercel AI SDK) | Apache-2.0 | Default cloud-LLM driver inside `@graphorin/provider`. |
| [`node-llama-cpp`](https://github.com/withcatai/node-llama-cpp) | MIT | In-process GGUF execution in `@graphorin/provider-llamacpp-node`. |
| [`js-tiktoken`](https://github.com/dqbd/tiktoken) | MIT | Token counting in `@graphorin/provider`. |
| [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) | MIT | Default storage in `@graphorin/store-sqlite`. |
| [`sqlite-vec`](https://github.com/asg017/sqlite-vec) | Apache-2.0 OR MIT | Vector-search SQLite extension. |
| [`@huggingface/transformers`](https://github.com/huggingface/transformers.js) | Apache-2.0 | Default in-process embedder. |
| [`hono`](https://github.com/honojs/hono) | MIT | HTTP router for `@graphorin/server`. |
| [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) | MIT | Underlying MCP client primitives. |
| [`@opentelemetry/*`](https://github.com/open-telemetry/opentelemetry-js) | Apache-2.0 | Tracer + OTLP exporter. |
| [`@napi-rs/keyring`](https://github.com/napi-rs/node-keyring) | MIT | OS-keychain backend. |
| [`@node-rs/argon2`](https://github.com/napi-rs/node-rs) | MIT | Argon2id KDF for the encrypted-file secrets store. |
| [`openid-client`](https://github.com/panva/openid-client) | MIT | OAuth 2.1 / PKCE flows. |
| [`commander`](https://github.com/tj/commander.js) | MIT | CLI argument parsing. |
| [`yaml`](https://github.com/eemeli/yaml) | ISC | YAML parsing for `SKILL.md` frontmatter. |
| [`zod`](https://github.com/colinhacks/zod) | MIT | Public-schema validation (peer dependency). |

## Versioning

Graphorin follows [SemVer](https://semver.org). Pre-1.0, minor bumps may carry breaking changes and patch bumps cover everything else (the industry pre-1.0 norm). All `@graphorin/*` packages are released **lockstep** at the same version while on the 0.x line.

Once Graphorin reaches `1.0`, strict SemVer applies and optional packages can move independently.

