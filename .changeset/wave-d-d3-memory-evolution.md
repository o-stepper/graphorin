---
'@graphorin/core': minor
'@graphorin/store-sqlite': minor
'@graphorin/memory': minor
---

Memory architecture evolution (audit 2026-07-04 Wave D, cluster D3) - opt-in; defaults byte-identical.

- Learned-context digest block (Letta sleep-time): a deep-phase pass rewrites the reserved `learned_context` working block from recent evidence via one budgeted LLM call (`consolidator.learnedContext`, off at every tier).
- Principal/owner dimension (`MemoryOwner` on facts/episodes/rules/insights, migration 026) stamped `'agent'` on synthesized writes, with a retrieval-time `owner` filter (`FactSearchOptions.owner`); default reads apply no filter.
- Retrieval-frequency reinforcement: `facts.access_count` (migration 027) + opt-in `SalienceWeights.accessReinforcement` (default 0 = inert).
- Runbook memory: `rules_fts` (migration 028) + `ProceduralMemory.search` returns whole validated procedures, with a gated `runbook_search` tool (`createMemory({ runbookSearch: true })`).
