---
title: Changelog
description: "A rolled-up release-note feed for the framework. Per-package CHANGELOGs live in each `@graphorin/*` workspace."
editLink: false
---

<!--
  This page is auto-synced from /CHANGELOG.md on every documentation build.
  Do not edit it directly - change /CHANGELOG.md in the repository root.
-->

# Changelog

All notable changes to the Graphorin framework are documented in this
file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(pre-1.0: minor bumps may carry breaking changes; patch bumps do not).

Per-package changelogs live in each package's `CHANGELOG.md`.

> **Publication note.** Versions `0.1.0`-`0.4.0` were lockstep version
> milestones developed in the open; public npm publication of the
> `@graphorin` scope (with [Sigstore](https://www.sigstore.dev/) build
> provenance) begins with `0.5.0`.

---

## 0.6.0 - 2026-07-05

The second framework-wide **audit release** - waves A-E of the 2026-07-04
audit (220 findings) - plus a full documentation accuracy + character-rules
sweep. Per-package details live in each package's `CHANGELOG.md`; upgrade
notes are in the migration guide (`documentation/guide/migration.md`).

### Security & correctness (waves A-B)

- Tool parameters are **real JSON Schema on the provider wire**: a structural
  Zod v3/v4 converter (`@graphorin/tools/schema`) replaces serialized
  validator internals; unprojectable schemas degrade loudly.
- **Durable HITL resume is exactly-once**: an approved call's resume writes a
  write-ahead intent checkpoint before dispatch and the journaled state after
  it; stale pre-execution snapshots stay bounded at one re-execution.
- Transcript well-formedness invariant in the step builder, hook-level
  `allowSensitivity`, session `purge()` cascade, `disableRepair`,
  `prefixMessages` token basis, spill-file taint sidecars,
  superseded-facts-excluded-by-default reads, an emergency compaction tier,
  IMMEDIATE SQLite transactions + an online backup API, MCP result-handle
  scoping + ReDoS guards, and the `ai` v7 provider-contract conversion.

### SOTA adopts (wave C)

- **Prompt-cache economics end-to-end**: `Usage` cache read/write legs, the
  opt-in `cachePolicy` breakpoint anchors, a cache-friendly tool catalogue,
  and cache-aware cost tracking over a regenerated pricing snapshot.
- Recoverable tool-error envelope + transparent bounded retry, the verifier
  seam, deterministic replay (`recordProviderResponses` +
  `createReplayProvider`), compaction hardening (`preserveUserMessages`),
  trust-aware recall ranking + `fitFusionWeights`, derived-taint `'strict'`
  mode with recall re-arm and MCP TOFU pinning, one-trace-tree `agent.run` /
  `agent.step` spans, and eval A/B switches with a non-self judge.

### Durable runtime (wave D)

- **Step-journal workflow durability**: durable timers, awakeables,
  approvals, and compare-and-set checkpoint writes
  (`CheckpointStore.put({ expectedLatestId })`); the `'async'` durability
  source is removed.
- Sub-agent isolation (read-only capability, `contextFold`, taint
  propagation), memory learned-context / owner / access-counters / runbooks
  (migrations 026-028), Merkle audit checkpoints + a skill-signing trust
  root + Progent / Rule-of-Two argument policies, and PPR-lite graph
  retrieval with entity-match fusion.

### Cross-cutting (wave E)

- **A ~2000x graph-CTE query-plan fix** in the SQLite store's entity
  expansion, found by the new 100k-fact scale probe (`benchmarks/scale`);
  the latency and memory-sim benchmark gates are armed for real.
- Release pipeline: the changesets 1.0.0 peer-escalation landmine defused
  (ranged internal peers + `onlyUpdatePeerDependentsWhenOutOfRange` +
  private-package ignore), tarball surface fixes (`@graphorin/memory`
  `./conflict` runtime-empty subpath, per-package CHANGELOG backfill),
  stricter `mvp-readiness` release gates.
- Supply chain + CI: SHA-256-pinned eval datasets (`scripts/datasets.lock.json`),
  failure notifications for scheduled workflows, job timeouts everywhere.
- Deployment templates fixed against reality (kubectl YAML-1.1 octal
  `defaultMode`, systemd `ExecReload` removal, docker config/secrets
  mounts), the Windows `storage cleanup-backups` no-op fixed, OTel GenAI
  span-name alignment, and eval statistics (Wilson intervals, pass^k,
  McNemar paired significance) attached to every eval summary.

### Documentation

- Every authored page re-verified against the code: 40 confirmed drift
  fixes (fictional `calculateCost` examples, health-check shapes,
  session-export record kinds, redaction-pattern catalogue, deployment
  template claims, and more), with the doc gates extended so the drift
  class cannot silently recur (28 compile-checked snippets, CLI-docs
  flag validation, anchor-checking lychee in offline file mode).
- A character-rules sweep across all markdown, TSDoc, and user-facing
  strings (ASCII punctuation only), and a new Performance & scale guide
  (`documentation/guide/performance.md`) with measured 100k-fact numbers.

## 0.5.0 - 2026-06-14

A framework-wide **audit-remediation** release - waves 0-4 of a 301-finding
security + correctness audit - plus SOTA adopts across memory, tools, and the
agent runtime. This is the **first release published to the npm registry**.

### Security & correctness

- Closed actively-exploitable holes: code-mode `process.env` exfiltration, the model-driven memory-quarantine bypass, object tool-outputs bypassing truncation + inbound sanitization, the encrypted-secrets-store silent data-loss path, the concurrent-`appendAudit` race, the GDPR `purge()` FK failure, idempotency-replay scope bypass, and per-IP rate-limit spoofing.
- Fail-loud over silent corruption: secrets/audit write paths, provider retry + fallback on network errors, and four trigger-scheduler bugs (spurious catch-up, interval double-fire, error-death, long-horizon `setTimeout` overflow).

### Completed core mechanisms

- Durable HITL resume now executes an approved tool exactly once; workflow crash-recovery + frontier persistence; `ContextEngine.assemble()`, guardrails, structured `outputType`, and the previously-inert `AgentConfig` fields are wired or removed.
- Memory: tokenized FTS recall, honest metadata counts, server-wired background consolidation, real sliding-window cost budgets, and a quarantine promotion path.
- Streaming server end-to-end (SSE / WebSocket), config-driven storage encryption, provider request timeouts + JSON-mode, and the Vercel AI SDK v7 chunk shapes.

### SOTA adopts (eval-gated)

- Compaction clearing-tier with recoverable `read_result` handles + reclaim-floor and Errors/Next-steps summary sections; the FIDES data-flow lattice; prompt-cache-aware tool catalogue with worked tool-use examples and end-to-end structured output; step-journal exactly-once resume; OpenTelemetry GenAI span mapping.

### Hardening & honesty (wave 4)

- Obfuscation-resistant taint detection, opt-in deny-wins supply-chain precedence, audit-prune + 1Password-CLI-timeout fixes, all-occurrence / cross-delta redaction, a cross-embedder entity-resolution guard, revived no-network guard coverage, and a documented security **Known limitations** section.

## 0.4.0 - 2026-05-26

The **memory program** (P0-1 … P2-2) - a research-grade rebuild of
`@graphorin/memory`.

### Added

- **Temporal memory** - bitemporal `as_of` reads and a `fact_history` tool (migration 013).
- **Injection defense** - provenance + quarantine on extracted facts, an agent-callable `fact_validate` promotion gate, and offline injection heuristics.
- **Consolidation** - neighbour-aware extract→reconcile, auto-importance + episode formation, and deep-phase reflection that synthesises read-only **insights** (migration 014).
- **Retrieval** - contextual retrieval with late-chunking (default), query transformation (multi-query / RAG-Fusion + opt-in HyDE), weighted/convex fusion, an in-SQLite **entity graph** with one-hop expansion (migrations 015-016), agentic/iterative retrieval (`deep_recall`), and **procedural memory** induction (migration 017).
- **Hygiene** - multi-signal forgetting / capacity-bounded eviction, and recall introspection (`graphorin memory inspect` / `activity`).
- An offline-first **eval harness** (`@graphorin/evals`) with LongMemEval / LOCOMO loaders.

## 0.3.0 - 2026-05-24

**Tools & harness** end-to-end (WI-01 … WI-13).

### Added

- **Defer-loading tool catalogue** - large tool sets are summarised; full schemas load on demand through a Tool Search seam.
- **Spill-to-handle results** - oversized tool outputs spill to a handle re-fetchable via `read_result`, bounding context growth.
- **Code-mode execution** - the model can drive tools through a sandboxed code API instead of one call per step.
- **Deterministic dataflow / taint policy** - opt-in `dataFlowPolicy: 'shadow' | 'enforce'` gates untrusted-to-sink flows and the lethal trifecta at `executeOne`.
- **MCP surface completion** - `resource_link` → handles, gated elicitation / sampling hooks, and composable result readers.

## 0.2.0 - 2026-05-21

A hardening / quick-wins maintenance release driven by an internal
action-item audit: dependency and supply-chain hygiene, CI tightening,
and assorted correctness fixes across the runtime and tooling.

## 0.1.0 - 2026-05-09

The first tagged version of the Graphorin framework. All `@graphorin/*`
packages are versioned together at `0.1.0` (lockstep on the `0.x`
line).

### Added

#### Runtime, memory, workflow

- `@graphorin/agent` - agent runtime with streaming events, steering /
  follow-up queues, `prepareStep` hook, HITL durable resume, multi-agent
  handoffs (`Agent.toTool({ secretsInheritance })`), composable stop
  conditions, fan-out + evaluator-optimizer loops, structured-handoff
  artifacts.
- `@graphorin/memory` - six-tier memory: working / session / episodic /
  semantic (bi-temporal default-on) / procedural / shared. Multi-stage
  conflict resolution (exact dedup → embedding three-zone → heuristic
  regex → subject/predicate). Hybrid search with Reciprocal Rank Fusion
  default. Memory-aware system prompt with built-in English locale pack
  and a pluggable per-locale extension point. Background consolidator
  with `light` + `standard` + minimum-viable `deep` phases, mandatory
  noise filter, lock-then-defer policy, idempotency cursor, dead-letter
  queue, and a default `tier: 'free'` cost budget.
- `@graphorin/workflow` - durable step-graph runtime with a
  synchronous-step model, in-memory channels (`LatestValue`, `Reducer`,
  `Stream`, `Barrier`, `Ephemeral`, `AnyValue`, `ListAggregate`),
  `pause` (HITL) / `resume`, four stream modes (`values` / `updates` /
  `tasks` / `debug`), `Directive` and `Dispatch` primitives.
- `@graphorin/sessions` - hybrid session facade with the agent registry,
  handoff records, JSONL export schema 1.0, and replay reconstruction.
  Session messages are owned by `@graphorin/memory` (single source of
  truth, DEC-147).

#### External surface

- `@graphorin/tools` - typed tool registry, parallel execution,
  `needsApproval` flow, sandboxed execution, four-strategy result
  truncation pipeline, streaming-tool execution surface, built-in
  `tool_search` lookup tool.
- `@graphorin/skills` - Anthropic Agent Skills format compatible loader
  with `graphorin-*` namespaced extensions; ed25519 signature
  verification on install (DEC-140 / ADR-034); slash commands
  (`/skill:name`); progressive-disclosure activation; sandbox-tier-aware
  execution.
- `@graphorin/mcp` - Model Context Protocol client (stdio +
  Streamable HTTP + legacy SSE); typed `MCPClient`; `toTools()` adapter
  with inbound prompt-injection sanitization, deferred-loading auto-default,
  structured-content + outputSchema round-trip, per-server priority and
  collision strategy; pluggable `EventStore` for resumable sessions;
  OAuth bridge backed by `@graphorin/security/oauth`.

#### Persistence + provider

- `@graphorin/store-sqlite` - default storage adapter on top of
  `better-sqlite3@^12.9.0` + `sqlite-vec@~0.1.9` + FTS5 with
  `unicode61 remove_diacritics 2 tokenchars '-_.@/'`. WAL hardening
  pragmas, WorkerPool wrapper for the standalone server.
- `@graphorin/embedder-transformersjs` - default in-process embedder
  (`Xenova/multilingual-e5-base`, multilingual). WebGPU when available.
- `@graphorin/embedder-ollama` - first-class opt-in alternative against
  an Ollama daemon (`nomic-embed-text` default, multi-model support).
- `@graphorin/triggers` - cron / interval / idle / event triggers; same
  code path in library and standalone-server modes (DEC-150).
- `@graphorin/provider` - vendor-neutral `Provider` interface; default
  `vercelAdapter` wrapping the Vercel AI SDK (v7 beta); `ollamaAdapter`,
  `llamaCppServerAdapter`, and `openAICompatibleAdapter` for local LLMs;
  shared `LocalProviderTrust` classifier; provider middleware composer
  with enforced ordering (DEC-145 / ADR-039) - `withRedaction` is
  mandatory innermost.
- `@graphorin/provider-llamacpp-node` - companion package for
  in-process GGUF execution via `node-llama-cpp@^3.5`.

#### Cross-cutting infrastructure

- `@graphorin/security` - `SecretValue` wrapper end-to-end with
  leakage barriers; `SecretRef` URI scheme (`env:` / `keyring:` /
  `file:` / `encrypted-file:` / `op://` / `vault://` / `ref:`);
  `KeyringSecretsStore` default via `@napi-rs/keyring`; sandbox tiers
  (`worker-threads` default + `docker` + `isolated-vm` + `none`);
  memory-modification guard (xxhash-fingerprint hash chain);
  HMAC-SHA256 + pepper server-token auth (DEC-122 / ADR-027);
  encrypted `audit.db` with SHA-256 hash chain; OAuth flows via
  `openid-client@^6.x`; ed25519 skill-signature verifier; process
  hardening (umask, refuse-root, file-mode policy).
- `@graphorin/observability` - OpenTelemetry tracer with GenAI Semantic
  Conventions; typed `AISpan<SpanType>`; `ConsoleExporter` /
  `JSONLExporter` / `OTLPHttpExporter` with mandatory
  `RedactionValidator` (default-deny non-public, DEC-141 / ADR-035).
  Eval interfaces only; the full eval framework ships in
  `@graphorin/evals`.
- `@graphorin/pricing` - separate package; bundled
  `@pydantic/genai-prices` snapshot; `graphorin pricing refresh`
  opt-in (never invoked automatically).

#### Standalone runtime

- `@graphorin/server` - optional REST + WebSocket + SSE runtime built
  on Hono. REST `Idempotency-Key` per IETF draft-07 (DEC-142 /
  ADR-036), durable HITL across process restarts, lifecycle hooks,
  triggers daemon, consolidator daemon, replay endpoints, `/v1/health`
  + `/v1/metrics` (Prometheus, opt-in auth), audit verify endpoint.
- `@graphorin/cli` - operator CLI binary (`graphorin start | init |
  migrate | doctor | token | secrets | storage | audit | memory |
  consolidator | triggers | auth | pricing | skills | traces |
  migrate-export | guard | telemetry`).
- `@graphorin/protocol` - browser-friendly schemas for the WebSocket
  protocol contract `graphorin.protocol.v1` (DEC-127 / ADR-031).
- `@graphorin/client` - browser-friendly TypeScript client for the
  standalone server.

#### Optional sub-packs

- `@graphorin/store-sqlite-encrypted` - SQLCipher v4 encryption-at-rest
  via `better-sqlite3-multiple-ciphers@^12.9.0` (DEC-129 / ADR-030).
  Required for the always-encrypted `audit.db` on fresh installations.
- `@graphorin/secret-1password` - reference `SecretResolver` for
  `op://` URIs through the 1Password CLI.
- `@graphorin/reranker-transformersjs` - pluggable cross-encoder
  reranker on top of `@huggingface/transformers`.
- `@graphorin/reranker-llm` - pluggable LLM-judge reranker.
- `@graphorin/eslint-plugin` - ESLint rules for projects that build
  on Graphorin (`no-secret-unwrap`, `no-secret-in-deps`,
  `provider-middleware-order`, `no-implicit-network-call`,
  `no-third-party-workflow-aliases`, `no-bare-tool-exec`,
  tool-discovery surface).
- `@graphorin/evals` - full evaluation framework (scorers, datasets,
  runner, reporters; decoupled from `@graphorin/observability` per
  RB-17 / DEC-152).

### Privacy and security baselines

- **Zero default telemetry** (DEC-154 / ADR-041). The framework
  generates no outbound network call you did not initiate. The CI
  workflow `check-no-network.yml` enforces this against the source
  tree on every push and pull request.
- **Sigstore build provenance** on every published package
  (`publishConfig.provenance: true` + `npm provenance` on the GitHub
  Actions release workflow).
- **Pre-launch security audit** completed against the project's STRIDE
  threat model and the OWASP LLM Top 10 (2025): 0 Critical, 0 High
  findings; Medium / Low findings documented with v0.2 owners.

### Examples

The repository ships eight example apps:

- `personal-assistant-cli` - single-agent local CLI (library mode,
  hello-world target).
- `slack-bot-integration` - server mode + WebSocket + durable HITL
  approvals across server restart.
- `background-consolidator` - server mode + cron triggers + light /
  standard consolidator phases.
- `multi-agent-crew` - supervisor + 2 worker agents (RB-33 acceptance
  scenario).
- `approval-workflow` - `@graphorin/workflow` HITL durable resume via
  `pause()` / `Directive(resume)` across server restart.
- `document-pipeline` - `@graphorin/workflow` `Dispatch` + parallel
  nodes + every channel type.
- `three-agent-harness` - Planner / Generator / Evaluator harness
  with structured-handoff artifacts; `Agent.fanOut(...)` +
  `evaluatorOptimizer(...)` (RB-50 reference).
- `local-stack-cli` - fully local stack (Ollama LLM + Ollama
  embeddings + SQLite + sqlite-vec, no cloud calls).

Distribution templates: `docker/`, `k8s/`, `systemd/`, `github-actions/`.

### Benchmarks

- `benchmarks/locomo` - LoCoMo benchmark runner (10 conversations,
  200 questions); per-question accuracy + per-conversation aggregates
  + cost summary.
- `benchmarks/locomo-multilingual` - community-contribution hooks for
  per-locale subsets.
- `benchmarks/dialogue-smoke` - dialogue smoke test (wiring check; not
  the published DialSim benchmark).
- `benchmarks/memory-sim` - synthetic-dialogue memory simulator.
- `benchmarks/latency` - p50 / p95 FTS memory-search latency probe.
- `benchmarks/cost` - per-conversation token-cost regression suite
  (CI budget assertion, must not increase > 10 % between runs).

### Documentation

- Per-package `README.md` covers the public surface, configuration,
  and dependency footprint.
- `SECURITY.md` documents the disclosure process, supported versions,
  cryptographic baselines, and the privacy promise.
- `CONTRIBUTING.md` covers the development workflow, conventions, and
  commit format.
- `CODE_OF_CONDUCT.md` reproduces the unmodified Contributor Covenant
  v2.1 text.
- `THIRD_PARTY_NOTICES.md` lists every runtime, optional, and
  build-time dependency with its license and the role it plays in
  Graphorin.

### Hello-world target

A 20-line script that creates a memory-backed agent, streams tokens,
persists facts to local SQLite via local `transformers.js` embeddings,
survives process restart for HITL approvals when run via
`graphorin start`, and emits OpenTelemetry spans (file or console
exporter). The example lives in `examples/personal-assistant-cli/`.

