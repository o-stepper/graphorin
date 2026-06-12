---
'@graphorin/memory': minor
---

MRET-2 / MRET-11: iterative retrieval can now actually benefit from
reformulation passes.

- The grade window interleaves the top hits of EVERY pass (latest
  included) instead of replaying pass 1's head — on a populated store
  pass 1 saturated the window, so the grader saw byte-identical
  snippets forever, span to the cap, and `deep_recall` returned a false
  abstain for answers pass 2 had actually retrieved.
- The final `maxResults` cut runs on a re-fused ranking
  (`IterativeRetrievalDeps.fuse`, wired to RRF in
  `SemanticMemory.searchIterative`) instead of discovery order, so a
  reformulation-pass find can outrank pass-1 noise instead of being
  silently dropped behind it.
- Sufficiency is always graded against the ORIGINAL question
  (CRAG/Self-RAG semantics) — a narrowed reformulation can no longer be
  declared "sufficient" while the original multi-hop question is not.
  Already-tried reformulations ride along as grader context
  (`RetrievalGradeOptions.triedQueries`).
