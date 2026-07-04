---
'@graphorin/memory': minor
---

Retrieval trust and quality (audit 2026-07-04 Wave C, cluster C5).

- Trust-aware retrieval ranking (MINJA defense): search multiplies each fused score by a rank-time trust factor reusing the eviction path's `SalienceWeights` - quarantined-but-included rows x0.3, foreign provenance (tool/imported/reflection/induction) x0.8, first-party UNTOUCHED. Surfaced as the `trust` signal on hits / `explainRecall`; per-call `trustWeighting: 'off'` escape hatch; weights follow `consolidator.salienceWeights`.
- Offline fusion-weight fitting: new pure `fitFusionWeights(cases, { grid, k })` + `ndcgAtK` in `@graphorin/memory/search` grid-search `FusionWeights` against labelled queries and report the plain-RRF baseline alongside.
- Extraction decontextualization (memory-consolidation-08): each extracted fact must now be a self-contained proposition (pronouns/ellipses resolved, entities inlined).
- rerankers.md rewritten: warns against installing a positional `WeightedRRFReranker` as process default (mis-assigns weights under fan-out - memory-retrieval-04), promotes the local cross-encoder as the first learned reranker to reach for, documents the fitting routine and the trust discount.
