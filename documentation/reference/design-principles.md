---
title: Design principles
description: Eighteen design principles encoded into the framework. If a feature contradicts a principle, the feature loses.
---

# Design principles

Eighteen design principles drive every decision in Graphorin. **If a feature contradicts a principle, the feature loses.** No drift. No scope creep. No surprises.

## The eighteen principles

### 1. Local-first by default

User data lives on the user's machine unless the operator explicitly opts in to a remote store, a remote provider, or a remote tracer. The default install pulls in zero implicit network calls.

### 2. Vendor-neutral on LLMs

A single `Provider` interface adapts every backend. Switching models is a one-line change.

### 3. Streaming-first API

Every operation is an `AsyncIterable<...>` of typed events. Nothing happens behind the curtain - tokens, tool calls, memory writes, handoffs, compaction, fallback transitions are all events your code can react to.

### 4. ESM-only

Every package ships ESM only and runs on Node.js 22+. CommonJS has no native ESM-async story; we don't ship the worse half of an interop story.

### 5. Type-safe public surface

Zero `any` in public APIs. Schemas (Zod) flow through tools, memory blocks, and structured outputs. Discriminated unions in the runtime carry an `assertNever(...)` exhaustiveness check.

### 6. Sensitivity is a first-class attribute

Every message, memory row, tool result, and trace attribute carries a `'public'` / `'internal'` / `'secret'` tag. The default for an unfamiliar destination is **deny everything except `public`**.

### 7. Secrets cannot leak by accident

`SecretValue` and `SecretRef` make the right path the easy path. Telemetry redaction is mandatory; you cannot disable it.

### 8. Every privileged operation is audited

The audit log is encrypted-at-rest and SHA-256 hash-chained. Tampering breaks the chain.

### 9. The runtime is durable

Workflows checkpoint after every step. Agent runs serialise to JSON. Pending approvals can survive a process restart on a different machine. (One current limit: a granted approval resumed on another machine is recorded but the approved tool is not re-executed yet - see the caveat in [Agent runtime § Durable HITL](/guide/agent-runtime#durable-hitl).)

### 10. Human-in-the-loop is a primitive

`pause(value)` in the workflow engine and `tool.approval.requested` in the agent runtime are first-class - not bolted on, not opaque, not forced through a hosted dashboard.

### 11. Memory is a real model, not a vector DB

Six tiers (plus derived insights), multi-stage conflict resolution, bi-temporal storage with point-in-time time-travel, hybrid search over an entity graph, and a budgeted background consolidator that reflects, forgets, and learns. Old facts are **superseded, never silently overwritten**, and synthesised memory is **quarantined until validated**.

### 12. Tools, Skills, and MCP all surface the same way

From the model's point of view, every callable is a typed `Tool` with input / output schemas, sensitivity, side-effect class, and sandbox tier. Where it came from is metadata, not behaviour.

### 13. Handoffs are explicit

Multi-agent transfers go through a typed input filter that produces a serialisable descriptor. The default filter is `lastN(10)`. Replays reproduce the boundary byte-equal.

### 14. Sub-agents inherit by allowlist

The default `secretsInheritance: 'inherit-allowlist'` with an empty `inheritSecrets` array enforces the **principle of least authority** across multi-agent boundaries.

### 15. No proprietary names borrowed

Every name in the public surface is Graphorin's. Nothing aliases to terms from another framework or library that is not a direct, named runtime dependency.

### 16. CI guards the contract

`pnpm run check-no-network` (zero-default-telemetry), `pnpm run check-licenses` (SPDX allowlist), `pnpm run check-anthropic-spec` (skills format snapshot drift), `pnpm run check-example-docs` (example README drift), `pnpm run mvp-readiness` (single entry point that runs every release-readiness gate sequentially).

### 17. Per-package boundaries are enforced

Every cross-package edge goes through a contract in `@graphorin/core/contracts`. No package imports from another package's internals.

### 18. Backwards compatibility is documented

Every change is a changeset. Every breaking change carries a deprecation note in the per-package `CHANGELOG.md`. The aggregated [changelog](/reference/changelog) is the authoritative rollup.

## Where the principles live

The principles encode the framework's promise. They show up in:

- The repository's CI workflows ([`.github/workflows/`](https://github.com/o-stepper/graphorin/tree/main/.github/workflows)).
- Per-package `CHANGELOG.md` files.
- The [Privacy promise](/guide/privacy) and [Security policy](/contributing/security).
- The `withValidation(...)` exporter wrapper that cannot be bypassed.
- The `Provider` middleware composer that asserts a canonical order.
- The `@graphorin/eslint-plugin` ruleset for downstream projects.

## Trade-offs we accepted

A few principles imply real costs:

- Local-first means embedder model downloads on first use and a slightly larger install footprint than a cloud-only framework.
- ESM-only means CommonJS consumers have to migrate. We picked clarity over compatibility.
- Mandatory redaction means an extra wrap call for every exporter. The tracer factory throws at runtime so the friction is paid once at startup, not as a silent regression.
- Lockstep versioning means a no-op patch may bump packages that did not change. We picked predictable upgrades over minimum churn.

## Trade-offs we did not accept

A few feature requests have been turned down because they would contradict a principle:

- An auto-update / version-ping channel.
- A "send anonymised crash reports" toggle.
- A globally-managed runtime that owns user data outside the operator's machine.
- A non-MIT licensing tier.

## Next steps

- [Privacy](/guide/privacy) - the no-phone-home contract.
- [Security](/guide/security) - sandbox + audit + supply chain.
- [Architecture](/guide/architecture) - the layered design.

