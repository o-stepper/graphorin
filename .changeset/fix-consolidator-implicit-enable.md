---
'@graphorin/memory': minor
---

MST-4: ANY non-empty `consolidator` config now implicitly enables the
real consolidator. The old allow-list only recognised
tier/phases/ceilings/models/provider/onPhaseFinished/defaultScope —
offline knobs like `decayCapacity`, `formEpisodes`, `reflection`,
`contextualRetrieval`, `salienceWeights` etc. silently produced a no-op
placeholder while the caller believed the feature was on (the guide's
own `consolidator: { contextualRetrieval: 'llm' }` snippet was a no-op
as written). `enabled: false` together with other settings keeps the
placeholder and warns once to stderr.
