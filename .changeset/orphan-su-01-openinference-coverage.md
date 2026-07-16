---
"@graphorin/observability": patch
---

fix(observability): ORPHAN-SU-01 map the insight tier + new consolidate phases to OpenInference kinds

The OpenInference kind table silently omitted 8 `KnownSpanType`s added later:
`memory.read/write/search.insight` (-> RETRIEVER) and the
`memory.consolidate.reflect / learned-context / curated-block /
profile-projection / promotion` phases (-> CHAIN). They returned null from
`openInferenceKindFor` and were not on the exclusion list, so their spans
carried no `openinference.span.kind`. A new compile-time-exhaustive test pins
that every `KnownSpanType` is mapped or explicitly excluded.
