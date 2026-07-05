---
title: Installation
description: Install the @graphorin/* packages from the npm registry. Node.js 22+ and any of pnpm, npm, or yarn are supported.
---

# Installation

Graphorin is published as a set of focused packages on the npm registry under the `@graphorin/*` scope. Packages are released **lockstep** at the same version while the framework is on the `0.x` line.

::: tip Status
The `@graphorin/*` packages are published on the npm registry since `v0.5.0`. Watch the [repository releases](https://github.com/o-stepper/graphorin/releases) for new versions.
:::

## Prerequisites

- **Node.js 22.x LTS or newer** (the project pins `>=22.0.0`).
- A package manager - **pnpm** is the project default; **npm** and **yarn** work too for consumers of the published packages.
- ESM-only modules. Your project must be `"type": "module"` (or use `.mjs` files) - Graphorin ships ESM.

## Supported platforms

The default stack pulls native modules (`better-sqlite3`, the `sqlite-vec`
vector extension, and - via `@graphorin/embedder-transformersjs` -
`onnxruntime`), so platform support is defined by their prebuilt binaries:

| Tier | Platforms | Notes |
|---|---|---|
| **CI-verified** | Linux x64, macOS arm64, Windows x64 | The full test suite runs on all three for every PR. |
| **Prebuilt, not CI-run** | Linux arm64, macOS x64 | Every native dependency ships prebuilds; expected to work. |
| **Partial** | Windows arm64 | Everything works **except vector search**: `sqlite-vec` publishes no `windows-arm64` binary and is a loadable extension with no compile-from-source fallback, so `@graphorin/store-sqlite` throws `SqliteVecMissingError` at first vector use. FTS + keyword recall still work. |

Additional platform notes:

- **Native build fallback.** If a prebuild is missing for an exotic target,
  `better-sqlite3`, the SQLCipher peer
  (`better-sqlite3-multiple-ciphers`), and `isolated-vm` compile from source -
  that requires a C++ toolchain and Python 3 at install time. `sqlite-vec`
  does not have this fallback (prebuilt-only).
- **Windows shutdown semantics.** `graphorin start` installs `SIGTERM` +
  `SIGINT` handlers for graceful drain. Windows never delivers a real
  `SIGTERM`, so use Ctrl+C / `SIGINT` (or the REST surface) to stop the
  daemon gracefully there; a service-manager TerminateProcess stop is abrupt.
- **POSIX file-permission hardening** (`0600`/`0700` on secrets, spill files,
  traces) applies on Linux/macOS only; on Windows, confidentiality of those
  files rests on NTFS ACLs of the profile directory.

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
| `@graphorin/agent` | Agent runtime - the typed `model -> tool calls -> model` loop. |
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
| `@graphorin/tools` | Custom typed tools beyond the eleven memory tools. |
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

**Graphorin** · v0.5.0 · MIT License · © 2026 Oleksiy Stepurenko
