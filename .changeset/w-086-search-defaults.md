---
'@graphorin/memory': minor
---

W-086: new `createMemory({ searchDefaults })` - construction-time retrieval defaults (`multiQuery`, `hyde`, `expandHops`, `entityMatch`, `graphScoring`, `fusion`, `decay`, `candidateTopK`) merged under every `SemanticMemory.search(...)` call, per-call options winning key-by-key. This is how the advanced retrieval stack reaches the model-facing surfaces: `fact_search`, auto-recall and `deep_recall` all funnel through `search()` and now inherit the defaults without custom tools (deep_recall's widen-pass `expandHops` override still wins, being per-call). The type deliberately excludes the trust-sensitive predicates (`includeQuarantined`, `includeSuperseded`, `trustWeighting`, `owner`) so configuration cannot silently weaken trust gates. Without `searchDefaults` behaviour is byte-identical. Exported as `SemanticSearchDefaults`.
