---
'@graphorin/core': patch
'@graphorin/store-sqlite': patch
'@graphorin/memory': patch
---

Retrieval and consolidation now honour the trust contracts they document (audit 2026-07-04 Wave B, cluster B3).

- memory-retrieval-01: default fact reads (FTS / vector / graph) behave as `asOf = now`, so superseded and validity-expired facts no longer surface as current - exactly what the `fact_supersede` tool promises. New `includeSuperseded: true` escape hatch (core `MemorySearchOptions`, memory `FactSearchOptions`, graph expand options) restores the full history for inspector / audit paths; `fact_search` and `deep_recall` outputs expose `validTo` / `supersededBy`.
- memory-retrieval-02: `deep_recall` passes `forceHard: true` (choosing the tool IS the hardness signal; the local heuristic gate rejected the tool's own documented examples and is English-only). Iterative results carry a new `graded` flag so ungraded single-shot passes stop claiming sufficiency as a verdict.
- memory-retrieval-03: a tagged search widens the fusion pool the same way decay does - the record-level tags filter runs after the topK cut, so tagged searches no longer silently return fewer than topK hits.
- memory-consolidation-01: the deep-phase dedup verdict now soft-forgets (replayable tombstone) instead of preferring the GDPR hard-delete `purge`, and a vanished conflicting fact skips the judge entirely (admit, no provider call) - a model verdict can no longer hard-delete the only surviving copy.
- memory-consolidation-07: the standard phase gains an embedder-independent exact-text duplicate guard (FTS + string equality, quarantine-aware), so replaying a partially-committed slice (DLQ / cursor retry) without an embedder no longer duplicates already-committed facts.
