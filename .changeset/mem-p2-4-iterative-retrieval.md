---
'@graphorin/memory': patch
---

P2-4 — agentic / iterative retrieval for hard queries (gated)
(see `memory-improvement-proposals.md` §5, summary-table row **P2-4 ·
Agentic/iterative retrieval (gated)**). A CRAG/Self-RAG-style
grade-then-reformulate loop for the multi-hop / temporal questions a
single retrieval pass can't answer — **gated** behind a difficulty check
so the default path stays single-shot, offline, and byte-for-byte
unchanged. Memory-only and fully additive ⇒ `patch` (pre-1.0).

- **New `@graphorin/memory/search` module `iterative.ts`.** Provider-
  agnostic (imports only `@graphorin/core` types; does no I/O itself):
  - `assessQueryDifficulty(query, { threshold? })` — a cheap, deterministic,
    fully **local** difficulty heuristic (multi-hop / temporal / comparison /
    multi-clause / length signals). Conservative: simple lookups score 0 and
    never enter the loop.
  - `RetrievalGrader` seam + `buildGradeRequest` / `parseGrade` (pure) +
    `createProviderRetrievalGrader(provider)` — **resilient**: a provider
    error or unparseable output degrades to a "stop" grade (it never throws
    into recall or drives endless reformulation).
  - `runIterativeRetrieval(query, deps, opts)` — a pure orchestrator over an
    injected `retrieve` + grader: difficulty gate → retrieve → grade → (if
    weak) reformulate + retrieve again, widening on reformulation passes →
    **abstain** when still insufficient. A mandatory iteration cap is clamped
    to `[1, MAX_ITERATIONS_CEILING (5)]`, and an already-tried query is never
    re-tried (the loop cannot spin).
- **`SemanticMemory.searchIterative(scope, query, opts)`** wires the loop to
  `search`, widening to one-hop graph expansion (`expandHops: 1`, P2-1) on each
  reformulation pass. Returns `{ hits, iterations, gateHard, sufficient,
  abstained, queries }` so the caller can decline to answer when
  `abstained` rather than confabulate. With no grader it runs exactly one
  difficulty-gated pass and makes **no provider call**.
- **New gated `deep_recall` tool.** Registered as a *twelfth* memory tool —
  **only** when the facade is built with `iterativeRetrieval`. Its output
  carries `sufficient` / `abstained` / `iterations`. The offline default tool
  surface stays at the canonical **eleven** (`buildMemoryTools` gains an
  optional `{ includeDeepRecall }`).
- **Opt-in wiring.** `createMemory({ iterativeRetrieval: { provider,
  maxIterations?, maxTokens? } })` builds the grader and registers
  `deep_recall`. Omitted (the default) ⇒ no grader, no `deep_recall`, and the
  read path stays offline + single-shot.

The mandatory gate + iteration cap are the latency guardrails the CRAG /
Self-RAG literature calls for. No new storage, no migration, and no
`@graphorin/core` change (the loop reuses the existing
`memory.search.semantic` span type).
