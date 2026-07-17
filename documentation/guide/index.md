---
title: What is Graphorin?
description: A TypeScript framework for building long-living personal AI assistants. The framework owns the agent loop, memory, workflow, observability, secrets, and an optional standalone server runtime.
---

# What is Graphorin?

> Graphorin is a TypeScript framework for building long-living personal AI assistants - a personal trainer, tutor, financial advisor, or business co-pilot that remembers, endures, and stays yours.

It is intentionally a **framework**, not a product. Assistant bots are built **on top of** Graphorin: the framework owns the agent loop, the six-tier memory system, the durable workflow engine, the tools / skills / MCP surface, sessions, observability, secrets, and an optional standalone server runtime. Higher-level products (channel adapters, UIs, business logic) live in your application code.

<FrameworkBadge />

## Goals

- **Universal core for personal AI assistants.** The framework is the foundation layer; assistant products are built on top of it.
- **Vendor-neutral on LLMs.** Multi-provider through a single `Provider` abstraction.
- **Rich memory model.** Working / session / episodic / semantic / procedural / shared, with explicit lifecycle handling.
- **Durable workflow.** Agent state survives a process restart; human-in-the-loop is a primitive, not a bolt-on.
- **Tools, Skills, MCP, RAG, observability** - supported as typed first-class surfaces.
- **Local-first.** By default, user data lives on the user's machine. Outbound LLM calls are minimised and explicit.
- **Streaming-first API.** Tokens, tool calls, intermediate steps, and memory writes are a single typed event stream.

## Non-goals (intentional)

- We do **not** build channel adapters (Telegram, Slack, iMessage, WhatsApp). Those belong to higher-level assistant products.
- We do **not** build a UI. Graphorin emits a typed event stream; any UI can consume it.
- We do **not** build a SaaS. The focus is the framework. A platform may be a separate product built on top.
- We do **not** build our own inference / model serving stack.

## Audience

The documentation is written for the people who will integrate Graphorin into a product:

- **TypeScript application developers** building a personal assistant or copilot.
- **Architects** who care about durable state, observability, and security baselines.
- **Operators** who will run the optional standalone server in production.
- **Contributors** who want to extend the framework with new providers, embedders, stores, or tools.

## What's in the box

| Area | Capability |
|---|---|
| Memory | Six-tier memory system - working / session / episodic / semantic / procedural / shared, with pluggable storage and a background consolidation pipeline. |
| Workflow | Durable step-graph runtime with checkpoints, pause / resume, and human-in-the-loop primitives. |
| Local-first | SQLite + the `sqlite-vec` extension + FTS5; multilingual embeddings via `@huggingface/transformers`; cloud is opt-in. |
| Privacy | Zero default telemetry - no phone-home, no version pings, no analytics. Verified by a CI check. |
| Providers | Multi-vendor LLM access through Graphorin's own `Provider` interface, built on top of the Vercel AI SDK. |
| Tools / Skills / MCP | Typed tools, an Agent Skills `SKILL.md`-format-compatible loader with progressive disclosure, and an in-core MCP client. |
| Observability | OpenTelemetry-native tracing with the GenAI Semantic Conventions, sensitivity-aware redaction, and replay. |
| Secrets | `SecretValue` wrapper, `SecretRef` URI scheme, OS keychain integration, optional encryption-at-rest. |
| Two-layer delivery | Embed any package as a library, or run `@graphorin/server` as a daemon with REST + WebSocket and durable triggers. |

## How to read these docs

1. Start with [Installation](/guide/installation) and [Quickstart](/guide/quickstart) to get a 20-line assistant running locally.
2. Read [Architecture](/guide/architecture) to understand how the layers fit together.
3. Drill into the subsystem pages on the left when you need depth.
4. Use the [API reference](/api/) for the auto-generated TypeScript surface.

## Status

Graphorin is currently on the `v0.11.0` pre-release line. The framework follows lockstep versioning across all `@graphorin/*` packages while on the `0.x` line; once it reaches `1.0`, optional packages and adapters are versioned independently.

