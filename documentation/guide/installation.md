---
title: Installation
description: Install the @graphorin/* packages from the npm registry. Node.js 22+ and any of pnpm, npm, or yarn are supported.
---

# Installation

Graphorin is published as a set of focused packages on the npm registry under the `@graphorin/*` scope. Packages are released **lockstep** at the same version while the framework is on the `0.x` line.

::: tip Status
The published `@graphorin/*` packages land on the npm registry as each implementation phase completes. Watch the [repository releases](https://github.com/o-stepper/graphorin/releases) for availability.
:::

## Prerequisites

- **Node.js 22.x LTS or newer** (the project pins `>=22.0.0`).
- A package manager — **pnpm** is the project default; **npm** and **yarn** work too for consumers of the published packages.
- ESM-only modules. Your project must be `"type": "module"` (or use `.mjs` files) — Graphorin ships ESM.

## Quickest install (memory-backed local assistant)

Most assistants will need at minimum: the agent runtime, the memory facade, a provider, and a storage adapter.

```bash
pnpm add @graphorin/agent @graphorin/memory @graphorin/provider \
        @graphorin/store-sqlite @graphorin/embedder-transformersjs \
        zod
```

```bash
npm install @graphorin/agent @graphorin/memory @graphorin/provider \
            @graphorin/store-sqlite @graphorin/embedder-transformersjs \
            zod
```

```bash
yarn add @graphorin/agent @graphorin/memory @graphorin/provider \
        @graphorin/store-sqlite @graphorin/embedder-transformersjs \
        zod
```

`zod` is a non-optional peer dependency of every `@graphorin/*` package that touches a public schema. Bring whichever Zod version your application already uses (`^3.23` or `^4`).

## What each package does

See the [Packages reference](/reference/packages) for the full list and one-line summaries. The most common starting set:

| Package | Role |
|---|---|
| `@graphorin/core` | Type system + cross-package contracts. Pulled in transitively. |
| `@graphorin/agent` | Agent runtime — the typed `model -> tool calls -> model` loop. |
| `@graphorin/memory` | Six-tier memory system with the consolidation pipeline. |
| `@graphorin/provider` | `Provider` interface + adapters (Vercel AI SDK, Ollama, OpenAI-compatible, llama.cpp HTTP). |
| `@graphorin/store-sqlite` | Default storage adapter on top of `better-sqlite3` + `sqlite-vec` + FTS5. |
| `@graphorin/embedder-transformersjs` | Default in-process multilingual embedder. |

## Optional add-ons

Add these as the assistant grows:

| Package | When to add it |
|---|---|
| `@graphorin/sessions` | Multi-agent attribution, JSONL export, session replay. |
| `@graphorin/workflow` | Durable HITL workflows that survive process restarts. |
| `@graphorin/tools` | Custom typed tools beyond the nine memory tools. |
| `@graphorin/skills` | Load skills from disk, npm packages, or Git repositories. |
| `@graphorin/mcp` | Talk to Model Context Protocol servers over stdio or Streamable HTTP. |
| `@graphorin/security` | Secrets (`SecretValue`, `SecretRef`), audit log, sandbox, OAuth. |
| `@graphorin/observability` | OpenTelemetry tracing + redaction. |
| `@graphorin/server` + `@graphorin/cli` | Run Graphorin as a daemon with REST + WebSocket. |
| `@graphorin/embedder-ollama` | First-class opt-in alternative embedder backed by an Ollama daemon. |
| `@graphorin/provider-llamacpp-node` | In-process GGUF execution via `node-llama-cpp`. |
| `@graphorin/store-sqlite-encrypted` | SQLCipher v4 encryption-at-rest. |
| `@graphorin/secret-1password` | Optional reference adapter for the 1Password CLI. |
| `@graphorin/eslint-plugin` | ESLint rules for projects that build on Graphorin. |

## Verifying the install

Once installed, the [Quickstart](/guide/quickstart) walks you through a 20-line script that creates a memory-backed agent, streams tokens, and persists facts to local SQLite.

## From source

For framework contributors:

```bash
git clone https://github.com/o-stepper/graphorin.git
cd graphorin
corepack enable
pnpm install --frozen-lockfile
pnpm -r build
pnpm -r test
```

See the [Contributing guide](/contributing/) for the full development workflow.

---

**Graphorin** · v0.2.0 · MIT License · © 2026 Oleksiy Stepurenko
