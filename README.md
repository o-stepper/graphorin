<div align="center">

<a href="https://graphorin.com">
  <img src="https://graphorin.com/assets/logo.svg" alt="Graphorin logo" width="160" height="160" />
</a>

# Graphorin

**A TypeScript framework for building long-living personal AI assistants.**

Six-tier memory · durable workflow · streaming-first API · observability · secrets · optional standalone runtime - local-first by default.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js: 22+](https://img.shields.io/badge/Node.js-22%2B-43853d.svg)](./.nvmrc)
[![Version: 0.10.0](https://img.shields.io/badge/version-v0.10.0-blue.svg)](./CHANGELOG.md)
[![Status: pre-release](https://img.shields.io/badge/status-pre--release-orange.svg)](#status)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ESM only](https://img.shields.io/badge/modules-ESM%20only-purple.svg)](https://nodejs.org/api/esm.html)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-fa6673.svg)](https://www.conventionalcommits.org)

[**Website**](https://graphorin.com) ·
[**Documentation**](https://docs.graphorin.com) ·
[**Repository**](https://github.com/o-stepper/graphorin) ·
[**Issues**](https://github.com/o-stepper/graphorin/issues) ·
[**Changelog**](./CHANGELOG.md) ·
[**Security**](./SECURITY.md)

</div>

---

> **Graphorin** is a foundation layer for higher-level assistant products - a personal trainer, a personal tutor, a personal business assistant, a personal financial advisor, and so on. It is intentionally a **framework**, not a product: assistant bots are built **on top of** it.

## Table of contents

- [Why Graphorin?](#why-graphorin)
- [Status](#status)
- [Use cases](#use-cases)
- [What's in the box](#whats-in-the-box)
- [Quick start](#quick-start)
- [Architecture at a glance](#architecture-at-a-glance)
- [Packages](#packages)
- [Privacy & no-phone-home](#privacy--no-phone-home)
- [Direct dependencies](#direct-dependencies)
- [Documentation](#documentation)
- [Repository layout](#repository-layout)
- [Release readiness](#release-readiness)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [Security](#security)
- [License](#license)
- [Maintainer & contact](#maintainer--contact)

## Why Graphorin?

- **Long-living, not single-shot.** Assistants built on Graphorin are designed to **remember**, **endure**, and **stay yours** - a six-tier memory model and a durable workflow runtime mean state survives a process restart and finishes on a different machine if it has to.
- **Local-first by default.** Zero implicit network calls. No version pings, no usage analytics, no auto-update phone-home. The only outbound traffic is the traffic your code initiates - verified by a continuous-integration check that fails the build on any forbidden socket call.
- **Vendor-neutral on LLMs.** A single `Provider` abstraction adapts cloud models, local Ollama daemons, OpenAI-compatible HTTP servers, and in-process GGUF execution. Switch models with a one-line change.
- **Streaming-first API.** Every operation is a typed `AsyncIterable<AgentEvent>` - tokens, tool calls, memory writes, handoffs, fallback transitions and human approvals all surface as events your UI can react to.
- **Type-safe end-to-end.** Zero `any` in public APIs. Schemas flow through tools, memory blocks, and structured outputs. Discriminated-union events come with exhaustive `assertNever(...)` checks.
- **Privacy and security as primitives.** A `SecretValue` type that cannot be accidentally logged, a `SecretRef` URI scheme, OS keychain integration, OAuth 2.1 with PKCE, sensitivity-aware payload tagging, optional encryption-at-rest, and a SHA-256 hash-chained audit log.
- **Embed or run as a daemon.** Use any package as a library inside your Node.js process, or promote your assistant to the optional standalone server with REST + WebSocket + SSE fallback and durable triggers.

## Status

Graphorin is currently on the **`v0.10.0`** pre-release line, **published on the npm registry** under the `@graphorin/*` scope. The framework follows **lockstep versioning** across all `@graphorin/*` packages while the framework is on the `0.x` line; once it reaches `1.0`, optional packages and adapters are versioned independently.

Pre-1.0, minor bumps may carry breaking changes and patch bumps cover everything else (the industry pre-1.0 norm). See [`CHANGELOG.md`](./CHANGELOG.md) for the authoritative rollup and the [repository releases](https://github.com/o-stepper/graphorin/releases) for what shipped when.

Latest release: **0.10.0** (2026-07-13) - the bot-adoption release: five feature waves that make the framework a complete substrate for a long-living personal assistant. Highlights: a vendor-neutral channel front door with pairing, an inbound taint boundary and a conformance testkit (new `@graphorin/channels`); proactivity - heartbeat, durable cron with fail-closed model pinning, and a notify/question/review/act escalation ladder with gated `act` (new `@graphorin/proactive`); a provable memory quality loop (operation-level eval metrics with a conflict-pipeline A/B, profile projection, a reviser tool split, and evidence-gated promotion behind an enforced ingest gate); four-value tool permissions (`allow | deny | ask | defer` with durable human-in-the-loop and deny-by-name); and the workflow durability tail (fork-with-patch, an operator CLI, cross-process resume pinned end-to-end). See the [changelog](./CHANGELOG.md) and the [migration guide](https://graphorin.com/guide/migration#_0-8-x-0-9-0) for upgrade notes.

## Use cases

Graphorin is the **engine**. You ship the **assistant**. The framework is intentionally domain-agnostic so the same primitives can power a wide range of personal AI products:

- **Personal trainer** - multi-week training plans, progressive overload memory, habit tracking.
- **Personal tutor** - long-running learner profiles, spaced repetition, durable lesson workflows.
- **Personal business assistant** - meeting prep, follow-ups, contact memory, durable approval flows.
- **Personal financial advisor** - bi-temporal facts, sensitivity-aware payloads, audited tool execution.
- **Health & wellness companions, knowledge workers, research copilots** - anywhere you need an assistant that remembers across sessions and survives process restarts.

What Graphorin **does not** ship (intentional): channel adapters (Telegram, Slack, iMessage, WhatsApp), a UI, a SaaS, or a model-serving stack. Those belong to higher-level assistant products built **on top of** Graphorin.

## What's in the box

| Area | Capability |
|---|---|
| **Memory** | Six-tier memory system - working / session / episodic / semantic / procedural / shared, with pluggable storage and a background consolidation pipeline. |
| **Workflow** | Durable step-graph runtime with checkpoints, pause / resume across process restarts, and human-in-the-loop primitives. |
| **Local-first** | SQLite + the `sqlite-vec` extension + FTS5; multilingual embeddings via `@huggingface/transformers`; cloud is opt-in. |
| **Privacy** | Zero default telemetry - no phone-home, no version pings, no analytics. Verified by a CI check. |
| **Providers** | Multi-vendor LLM access through Graphorin's own `Provider` interface, built on top of the Vercel AI SDK. |
| **Tools / Skills / MCP** | Typed tools, a `SKILL.md` packaging-format-compatible loader with three-tier progressive disclosure, and an in-core Model Context Protocol client. |
| **Observability** | OpenTelemetry-native tracing with the GenAI Semantic Conventions, sensitivity-aware redaction, and replay. |
| **Secrets** | `SecretValue` wrapper, `SecretRef` URI scheme, OS keychain integration, optional encryption-at-rest. |
| **Evals** | Offline-first eval harness - scorers (exact / regex / JSON-path / LLM-judge), dataset loaders with SHA-256 supply-chain pinning, statistical gates (Wilson intervals, pass^k, paired significance), and baseline regression detection. |
| **Two-layer delivery** | Embed any package as a library, or run `@graphorin/server` as a daemon with REST + WebSocket and durable triggers. |

## Quick start

The `@graphorin/*` packages are published on the npm registry (since `v0.6.0`). The full quickstart - a 20-line memory-backed agent that streams tokens and persists facts to local SQLite via local embeddings - lives at **<https://docs.graphorin.com/guide/quickstart>**.

### Prerequisites

- **Node.js** 22.x LTS or newer (see [`.nvmrc`](./.nvmrc)).
- Any package manager - **pnpm** is the project default; `npm` and `yarn` work fine for consumers.
- ESM-only modules: your project must be `"type": "module"` (or use `.mjs` files).

### Install from npm

A memory-backed local assistant needs at minimum the agent runtime, the memory facade, a provider, and a storage adapter:

```bash
pnpm add @graphorin/agent @graphorin/memory @graphorin/provider \
        @graphorin/store-sqlite @graphorin/embedder-transformersjs \
        zod
```

See the [Installation guide](https://docs.graphorin.com/guide/installation) for `npm`/`yarn` equivalents, what each package does, and the optional adapters.

### From source (framework development)

```bash
git clone https://github.com/o-stepper/graphorin.git
cd graphorin
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

(`build` and `test` run through turbo, so repeat runs hit the cache; see [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full local-gates checklist.)

## Architecture at a glance

Graphorin is built as a stack of focused packages. Each layer depends only on the layers below it, so you can pick the slice that matches your application - from a 20-line embedded agent up to a long-running daemon with REST + WebSocket and durable triggers.

```
Tier 6  Standalone server + DX     @graphorin/server · cli · protocol · client
Tier 5  Runtime                    @graphorin/agent · workflow
Tier 4  Memory & Sessions          @graphorin/memory · sessions
Tier 3  External surface           @graphorin/tools · skills · mcp
Tier 2  Persistence + Provider     @graphorin/store-sqlite · embedder-* · triggers · provider
Tier 1  Cross-cutting              @graphorin/security · observability · pricing
Tier 0  Foundation                 @graphorin/core (types · contracts · utilities · ESM-only)
```

Read the full architecture notes at <https://docs.graphorin.com/guide/architecture>.

## Packages

The framework is published as a set of focused packages on the npm registry under the `@graphorin/*` scope. Packages are released **lockstep** at the same version while the framework is on the `0.x` line.

| Package | Role |
|---|---|
| `@graphorin/core` | Core types, contracts, errors, ESM-only utilities. |
| `@graphorin/security` | Secrets, sandboxing, audit log, server-token auth, OAuth, supply chain. |
| `@graphorin/observability` | Tracing, redaction, eval interfaces. |
| `@graphorin/pricing` | Bundled LLM pricing snapshot + opt-in refresh. |
| `@graphorin/store-sqlite` | Default storage adapter on top of `better-sqlite3` + `sqlite-vec` + FTS5. |
| `@graphorin/embedder-transformersjs` | Default in-process multilingual embedder. |
| `@graphorin/embedder-ollama` | First-class opt-in embedder against an Ollama daemon. |
| `@graphorin/triggers` | Background tasks - cron / interval / idle / event. |
| `@graphorin/provider` | `Provider` interface and adapters (Vercel AI SDK, Ollama, OpenAI-compatible HTTP, llama.cpp HTTP server). |
| `@graphorin/provider-llamacpp-node` | Companion package - in-process GGUF execution. |
| `@graphorin/tools` | Typed tool definitions and execution. |
| `@graphorin/skills` | `SKILL.md` packaging-format-compatible loader with three-tier progressive disclosure. |
| `@graphorin/mcp` | Model Context Protocol client (stdio + Streamable HTTP). |
| `@graphorin/memory` | Six-tier memory system with consolidation pipeline. |
| `@graphorin/sessions` | Hybrid session facade, agent registry, handoffs, JSONL export, replay. |
| `@graphorin/agent` | Agent runtime. |
| `@graphorin/workflow` | Durable workflow engine. |
| `@graphorin/server` | Optional standalone server with REST + WebSocket + SSE fallback. |
| `@graphorin/cli` | Operator CLI. |
| `@graphorin/protocol` | WebSocket protocol contract - `graphorin.protocol.v1`. |
| `@graphorin/client` | Browser-friendly client for the standalone server. |
| `@graphorin/store-sqlite-encrypted` | Optional SQLCipher v4 encryption-at-rest. |
| `@graphorin/secret-1password` | Optional reference adapter for the 1Password CLI. |
| `@graphorin/reranker-transformersjs` | Optional cross-encoder reranker via `@huggingface/transformers`. |
| `@graphorin/reranker-llm` | Optional LLM-judge reranker. |
| `@graphorin/eslint-plugin` | ESLint rules for projects that build on Graphorin. |
| `@graphorin/evals` | Optional evaluation primitives - scorers, datasets, reporters, regression detection. |

The full per-package reference (status, role, public surface) lives at **<https://docs.graphorin.com/reference/packages>**.

Optional packages and adapters are versioned independently from the core lockstep release once the framework reaches `1.0`.

## Privacy & no-phone-home

Graphorin makes **zero implicit network calls**. The only outbound traffic Graphorin generates is the traffic your code initiates:

- LLM provider API calls
- MCP server connections
- OAuth flows
- Opt-in pricing-snapshot refresh
- Embedder model downloads
- Storage backend connections you wire yourself

The repository ships a `pnpm run check-no-network` CI check that fails if a non-allowed network call is introduced. See [`SECURITY.md`](./SECURITY.md) and the [Privacy promise](https://docs.graphorin.com/guide/privacy) for the full commitment.

## Direct dependencies

Graphorin uses the libraries below at runtime. Each is integrated through public APIs - the framework's source tree does not bundle, fork, or redistribute any third-party source. The full list (with pinned versions, SPDX identifiers, and transitive notes) lives in [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

| Library | License | Role inside Graphorin |
|---|---|---|
| [`ai`](https://github.com/vercel/ai) (Vercel AI SDK) | Apache-2.0 | Default cloud-LLM driver inside `@graphorin/provider`. |
| [`node-llama-cpp`](https://github.com/withcatai/node-llama-cpp) | MIT | In-process GGUF execution in `@graphorin/provider-llamacpp-node`. |
| [`js-tiktoken`](https://github.com/dqbd/tiktoken) | MIT | Token counting in `@graphorin/provider`. |
| [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) | MIT | Default storage adapter in `@graphorin/store-sqlite`. |
| [`sqlite-vec`](https://github.com/asg017/sqlite-vec) | Apache-2.0 OR MIT | Vector-search SQLite extension. |
| [`@huggingface/transformers`](https://github.com/huggingface/transformers.js) | Apache-2.0 | Default in-process multilingual embedder. |
| [`hono`](https://github.com/honojs/hono) | MIT | HTTP router for `@graphorin/server`. |
| [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) | MIT | Underlying MCP client primitives. |
| [`@opentelemetry/*`](https://github.com/open-telemetry/opentelemetry-js) | Apache-2.0 | Tracer + OTLP exporter. |
| [`@napi-rs/keyring`](https://github.com/napi-rs/node-keyring) | MIT | OS-keychain backend. |
| [`@node-rs/argon2`](https://github.com/napi-rs/node-rs) | MIT | Argon2id KDF for the encrypted-file secrets store. |
| [`openid-client`](https://github.com/panva/openid-client) | MIT | OAuth 2.1 / PKCE flows. |
| [`commander`](https://github.com/tj/commander.js) | MIT | CLI argument parsing. |
| [`yaml`](https://github.com/eemeli/yaml) | ISC | YAML parsing for `SKILL.md` frontmatter. |
| [`zod`](https://github.com/colinhacks/zod) | MIT | Public-schema validation (peer dependency). |

We are grateful to the maintainers of every project listed above. If you believe a component is missing from [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md), please [open an issue](https://github.com/o-stepper/graphorin/issues) or email the maintainer at <step.oleksiy@gmail.com>.

## Documentation

The complete documentation is hosted at **<https://docs.graphorin.com>**.

| Section | What you'll find |
|---|---|
| [What is Graphorin?](https://docs.graphorin.com/guide/) | Goals, non-goals, audience, and how to read the docs. |
| [Installation](https://docs.graphorin.com/guide/installation) | Prerequisites, the workspace-friendly install layout, peer dependencies. |
| [Quickstart](https://docs.graphorin.com/guide/quickstart) | A 20-line memory-backed agent that streams tokens and persists facts locally. |
| [Architecture](https://docs.graphorin.com/guide/architecture) | The layered package model, end-to-end agent step, and two delivery modes. |
| [Memory system](https://docs.graphorin.com/guide/memory-system) | The six tiers, hybrid search, and the consolidation pipeline. |
| [Workflow engine](https://docs.graphorin.com/guide/workflow-engine) | Durable HITL, checkpoints, dynamic parallelism. |
| [Providers](https://docs.graphorin.com/guide/providers) | Vendor-neutral provider matrix and the middleware composer. |
| [Tools, Skills, MCP](https://docs.graphorin.com/guide/tools) | The external-surface primitives. |
| [Standalone server](https://docs.graphorin.com/guide/standalone-server) | Promote your assistant to a daemon. |
| [Deployment](https://docs.graphorin.com/guide/deployment) | Production checklists plus the docker / k8s / systemd templates. |
| [Observability](https://docs.graphorin.com/guide/observability) | OpenTelemetry GenAI Semantic Conventions and the redaction layer. |
| [Secrets](https://docs.graphorin.com/guide/secrets) | `SecretValue`, `SecretRef`, the keychain backend, and the audit log. |
| [Evals](https://docs.graphorin.com/guide/evals) | The offline eval harness, scorers, statistics, and regression gates. |
| [Performance & scale](https://docs.graphorin.com/guide/performance) | Measured limits at 100k facts and how to reproduce the numbers. |
| [Migration](https://docs.graphorin.com/guide/migration) | Upgrade notes per version line, schema migrations, export formats. |
| [API reference](https://docs.graphorin.com/api/) | The auto-generated TypeScript surface. |
| [Design principles](https://docs.graphorin.com/reference/design-principles) | The eighteen principles encoded into the framework. |
| [FAQ](https://docs.graphorin.com/reference/faq) | Frequently asked questions. |

## Repository layout

```
packages/                Each @graphorin/* package lives here as its own workspace.
examples/                Stand-alone example apps that consume @graphorin/* packages.
benchmarks/              Latency, cost, memory-simulation, LongMemEval / LoCoMo,
                         tool-agent, and 100k-fact scale runners (PR-gated smokes).
documentation/           Source for the public documentation site (https://docs.graphorin.com).
scripts/                 Repo-wide maintenance scripts (license check, no-network guard,
                         release-readiness gate, example-doc drift, …).
.github/                 GitHub Actions workflows, issue templates, and PR template.
.changeset/              Changesets configuration; one file per pending release entry.
CHANGELOG.md             Top-level rollup release notes (per-package CHANGELOGs live
                         in each package).
THIRD_PARTY_NOTICES.md   Runtime + build-time dependency attribution + license map.
SECURITY.md              Vulnerability disclosure process + cryptographic baselines.
NOTICE                   Top-level attribution file referenced by the MIT LICENSE.
AUTHORS.md               Project authorship.
```

## Release readiness

The repository ships a single `pnpm run mvp-readiness` entry point that runs every release-readiness gate sequentially: `lint`, `typecheck`, `build`, `test`, the no-implicit-network guard, the SPDX license allowlist, the Skills-format snapshot drift check, a version-consistency gate (every workspace manifest and every version-bearing text site agrees with `packages/core/package.json`; code derives its version from the manifest, so hardcoded version literals fail), and a workspace audit (consistent version, MIT license, `Oleksiy Stepurenko` author, `publishConfig.provenance: true`, no `private: true` flag, `engines.node` set to `>=22`, required files present on disk, a current top entry in every per-package `CHANGELOG.md`, and every `exports` target resolvable in the built output).

The same command is invoked by the [`release.yml`](./.github/workflows/release.yml) workflow before any package gets published.

## Contributing

We welcome contributions. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the development workflow, conventions, commit format, and the local-checks checklist before opening a PR.

A few quick links:

- [Open an issue](https://github.com/o-stepper/graphorin/issues/new/choose)
- [Pull requests](https://github.com/o-stepper/graphorin/pulls)
- [Project authorship](./AUTHORS.md)
- [Conventional Commits](https://www.conventionalcommits.org)

By participating you agree to abide by the project's [Code of Conduct](./CODE_OF_CONDUCT.md).

## Code of Conduct

Graphorin adopts the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). The full text and the project's enforcement process live in [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). Reports can be directed to the maintainer at <step.oleksiy@gmail.com>.

## Security

Please **do not** open a public GitHub issue for security vulnerabilities. The preferred channel is a private GitHub Security Advisory at <https://github.com/o-stepper/graphorin/security/advisories/new>; you can also email <step.oleksiy@gmail.com>. See [`SECURITY.md`](./SECURITY.md) for the full disclosure process and the project's cryptographic baselines.

## License

Graphorin is released under the **MIT License** - a permissive license that allows commercial and non-commercial use, modification, and redistribution under the same terms. The full text lives in [`LICENSE`](./LICENSE).

```
Copyright (c) 2026 Oleksiy Stepurenko
```

The bundled [`NOTICE`](./NOTICE) file is referenced by the MIT LICENSE and lists the attribution requirements that survive redistribution.

## Maintainer & contact

Graphorin is created, owned, and maintained by **Oleksiy Stepurenko**.

- **Email** - <step.oleksiy@gmail.com>
- **Website** - <https://graphorin.com>
- **Documentation** - <https://docs.graphorin.com>
- **Repository** - <https://github.com/o-stepper/graphorin>

For commercial enquiries, partnerships, or anything that does not fit a public issue, please reach out by email.

---

<div align="center">

<a href="https://graphorin.com">
  <img src="https://graphorin.com/assets/logo.svg" alt="Graphorin" width="48" height="48" />
</a>

**Graphorin** · v0.10.0 · MIT License · © 2026 Oleksiy Stepurenko

[graphorin.com](https://graphorin.com) · [docs.graphorin.com](https://docs.graphorin.com) · [github.com/o-stepper/graphorin](https://github.com/o-stepper/graphorin) · <step.oleksiy@gmail.com>

</div>
