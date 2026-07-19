---
title: FAQ
description: Frequently asked questions about Graphorin - what it is, what it isn't, and how to use it in production.
---

# FAQ

## What is Graphorin in one sentence?

Graphorin is a TypeScript framework for building **long-living personal AI assistants** - a personal trainer, tutor, financial advisor, or business co-pilot that remembers, endures, and stays yours.

## Is Graphorin a product?

No. Graphorin is a **framework**. Assistant products (a fitness app, a tutor app, a finance copilot) are built on top of Graphorin in your own application code.

## Is it free / open source?

Yes. Graphorin is distributed under the [MIT License](https://github.com/o-stepper/graphorin/blob/main/LICENSE). © 2026 Oleksiy Stepurenko.

## Who maintains Graphorin?

Graphorin is created and maintained by **Oleksiy Stepurenko** (<step.oleksiy@gmail.com>). See the [Contributing guide](/contributing/) for how to contribute.

## What does the name mean?

It's the project's own coined name; no acronym, no expansion. The official logo and the colour palette (graphite + terracotta) are shared with [graphorin.com](https://graphorin.com).

## Does Graphorin phone home?

No. Graphorin makes **zero implicit network calls**. The only outbound traffic is what your code initiates explicitly. A continuous-integration check fails the build the moment a forbidden network primitive is introduced. See [Privacy](/guide/privacy).

## Which LLMs are supported?

Through the `Provider` interface, **any** LLM that speaks one of the supported wire formats:

- The Vercel AI SDK (`ai` package) - covers OpenAI, Anthropic, Google, Mistral, Groq, Cohere, etc.
- Ollama (HTTP).
- OpenAI-compatible HTTP servers (LM Studio, LocalAI, vLLM, Together.ai, …).
- The `llama.cpp` HTTP server.
- In-process GGUF via the `@graphorin/provider-llamacpp-node` companion package.

See [Providers](/guide/providers).

## Can I run Graphorin entirely offline?

Yes. SQLite + the bundled multilingual embedder + a local LLM (Ollama, llama.cpp, or in-process GGUF) cover every default. Set `GRAPHORIN_OFFLINE=1` to verify the offline contract; the runtime refuses to phone home.

## Does Graphorin store user data in the cloud?

Only if you configure it to. The default storage adapter writes to a local SQLite file; the audit log lives in a local encrypted SQLite file; secrets land in the OS keychain. Cloud storage is a deliberate, opt-in configuration.

## What's the minimum Node.js version?

**22.12 or newer** (`engines.node: '>=22.12.0'` - the first line where `require(esm)` is stable). Older versions are not supported. See [Installation](/guide/installation).

## ESM only? Why?

ESM is Node.js' native module system, and async-flow primitives behave correctly under it. Maintaining a parallel CommonJS surface would double the test matrix and force compromises that contradict the framework's "no `any` in the public surface" principle. CommonJS applications are not locked out: on Node 22.12+ a plain `require()` loads the same ESM instance (`require(esm)`), so no CJS build is needed.

## Can I use Graphorin in a browser?

The `@graphorin/client` package is the browser-friendly client for the standalone server. Its only runtime dependencies are `@graphorin/protocol` and `zod`. The runtime packages (memory, agent, workflow, server) are Node.js-only - they assume `better-sqlite3` and OS-level facilities.

## How does the memory system handle conflicts?

Through a five-stage pipeline - exact dedup, embedding three-zone classification, locale-aware regex heuristics, subject / predicate split, and a deferred LLM judge in the consolidator's deep phase. See [Memory system](/guide/memory-system).

## How big can a session get?

Sessions are append-only and stream. The context engine auto-compacts the buffer when it crosses the configured budget; the consolidator distils older content into long-term memory. A multi-month session is normal.

## What's a "trigger"?

A scheduled invocation of an agent - cron, fixed interval, idle, or event. See [Standalone server § Triggers](/guide/standalone-server#triggers).

## How does HITL work?

Two complementary mechanisms:

1. **Tool approvals.** Tools whose `needsApproval` predicate returns `true` raise a `tool.approval.requested` event. The run state can be persisted, the process can shut down, and another machine can resume it later via `agent.run(savedRunState, { directive: { approvals: [...] } })`. On resume, a **granted approval executes the approved call for real, through the same executor as any other tool call** - do **not** also perform the side effect in your own code, or it happens twice. Operational contract: persist `result.state` after **every** resume (or wire a `checkpointStore`, which persists the journaled post-dispatch state automatically) and resume from that latest state - then a re-delivered resume cannot double-fire. Re-resuming a *stale pre-execution snapshot* re-executes the call (bounded at one re-execution per stale resume), so give payment-class tools an idempotency key. See [Agent runtime § Durable HITL](/guide/agent-runtime#durable-hitl).
2. **Workflow `pause` / `resume`.** A workflow node calls `pause(value)`; the engine yields a `workflow.suspended` event and persists the checkpoint. `workflow.resume(threadId, directive)` re-enters the paused node.

See [Agent runtime](/guide/agent-runtime) and [Workflow engine](/guide/workflow-engine).

## How is observability handled?

OpenTelemetry-native. Every span follows the published GenAI Semantic Conventions. A mandatory `withValidation(...)` exporter wrapper enforces sensitivity-aware redaction with 14 built-in PII patterns. See [Observability](/guide/observability).

## Where do skills live?

Skills can come from a local folder, an npm package, or a Git repository. Untrusted sources require a verifiable Ed25519 signature, install with `--ignore-scripts`, and run under a mandatory sandbox (`worker-threads` + no network + no filesystem) that the skill's own frontmatter cannot relax - only the integrator can grant a higher trust level. See [Skills](/guide/skills).

## What is MCP, exactly?

The Model Context Protocol - a public protocol for tool / prompt / resource servers. Graphorin's client wraps `@modelcontextprotocol/sdk` over stdio and Streamable HTTP. See [MCP client](/guide/mcp-client).

## How do I deploy Graphorin in production?

See [Deployment](/guide/deployment) for systemd, Docker, Kubernetes, and CI templates.

## What's the relationship between agents and workflows?

Agents and workflows compose orthogonally. An agent loop runs the LLM-driven `model -> tool calls -> model` cycle. A workflow runs a durable step-graph that may invoke agents from individual nodes. Use `Dispatch(...)` for durable cross-step parallelism; use `agent.fanOut(...)` for inline reasoning-loop parallelism. See [Workflow engine § Composition](/guide/workflow-engine#composition-with-graphorin-agent).

## Can I extend Graphorin?

Yes. The contracts in `@graphorin/core/contracts` are deliberately small. Most extension points are pluggable:

- Custom storage adapters (`MemoryStore`, `SessionStore`, `CheckpointStore`, …).
- Custom embedders (`EmbedderProvider`).
- Custom rerankers (`ReRanker`).
- Custom provider adapters.
- Custom secrets resolvers.
- Custom redaction patterns.
- Custom token counters.
- Custom skill sources.

See the [API reference](/api/) for the contract signatures.

## Where do I report a security issue?

See the [Security policy](/contributing/security). **Please do not** open a public GitHub issue.

## Where can I get help?

- GitHub Discussions on the [repository](https://github.com/o-stepper/graphorin) (enabled post-launch).
- Issues on the [repository](https://github.com/o-stepper/graphorin/issues) for bug reports and feature requests.
- Email the maintainer at <step.oleksiy@gmail.com> for non-public matters.

## What's on the roadmap?

The framework is currently on the `v0.13.0` pre-release line. Watch the [repository releases](https://github.com/o-stepper/graphorin/releases) for milestones; the [Changelog](/reference/changelog) has the rolled-up history.

