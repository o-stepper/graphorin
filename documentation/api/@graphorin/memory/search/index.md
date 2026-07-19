[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / search

# search

Hybrid search composition for `@graphorin/memory`. Owns the
`ReRanker` contract and the built-in `RRFReranker` (k=60 default).

## References

### assessQueryDifficulty

Re-exports [assessQueryDifficulty](/api/@graphorin/memory/functions/assessQueryDifficulty.md)

***

### buildExpansionRequest

Re-exports [buildExpansionRequest](/api/@graphorin/memory/functions/buildExpansionRequest.md)

***

### buildGradeRequest

Re-exports [buildGradeRequest](/api/@graphorin/memory/functions/buildGradeRequest.md)

***

### buildHydeRequest

Re-exports [buildHydeRequest](/api/@graphorin/memory/functions/buildHydeRequest.md)

***

### createProviderQueryTransformer

Re-exports [createProviderQueryTransformer](/api/@graphorin/memory/functions/createProviderQueryTransformer.md)

***

### createProviderRetrievalGrader

Re-exports [createProviderRetrievalGrader](/api/@graphorin/memory/functions/createProviderRetrievalGrader.md)

***

### DEFAULT\_DIFFICULTY\_THRESHOLD

Re-exports [DEFAULT_DIFFICULTY_THRESHOLD](/api/@graphorin/memory/variables/DEFAULT_DIFFICULTY_THRESHOLD.md)

***

### DEFAULT\_MAX\_ITERATIONS

Re-exports [DEFAULT_MAX_ITERATIONS](/api/@graphorin/memory/variables/DEFAULT_MAX_ITERATIONS.md)

***

### DEFAULT\_MAX\_QUERY\_VARIANTS

Re-exports [DEFAULT_MAX_QUERY_VARIANTS](/api/@graphorin/memory/variables/DEFAULT_MAX_QUERY_VARIANTS.md)

***

### DEFAULT\_PPR\_DAMPING

Re-exports [DEFAULT_PPR_DAMPING](/api/@graphorin/memory/variables/DEFAULT_PPR_DAMPING.md)

***

### DifficultyAssessment

Re-exports [DifficultyAssessment](/api/@graphorin/memory/interfaces/DifficultyAssessment.md)

***

### DifficultyGateOptions

Re-exports [DifficultyGateOptions](/api/@graphorin/memory/interfaces/DifficultyGateOptions.md)

***

### explainRecall

Re-exports [explainRecall](/api/@graphorin/memory/functions/explainRecall.md)

***

### FitFusionCase

Re-exports [FitFusionCase](/api/@graphorin/memory/interfaces/FitFusionCase.md)

***

### FitFusionOptions

Re-exports [FitFusionOptions](/api/@graphorin/memory/interfaces/FitFusionOptions.md)

***

### FitFusionResult

Re-exports [FitFusionResult](/api/@graphorin/memory/interfaces/FitFusionResult.md)

***

### fitFusionWeights

Re-exports [fitFusionWeights](/api/@graphorin/memory/functions/fitFusionWeights.md)

***

### formatRecallExplanation

Re-exports [formatRecallExplanation](/api/@graphorin/memory/functions/formatRecallExplanation.md)

***

### fuseRrf

Re-exports [fuseRrf](/api/@graphorin/memory/functions/fuseRrf.md)

***

### fuseWeighted

Re-exports [fuseWeighted](/api/@graphorin/memory/functions/fuseWeighted.md)

***

### HYDE\_SYSTEM\_PROMPT

Re-exports [HYDE_SYSTEM_PROMPT](/api/@graphorin/memory/variables/HYDE_SYSTEM_PROMPT.md)

***

### isForeignProvenance

Re-exports [isForeignProvenance](/api/@graphorin/memory/functions/isForeignProvenance.md)

***

### IterativeRetrievalDeps

Re-exports [IterativeRetrievalDeps](/api/@graphorin/memory/interfaces/IterativeRetrievalDeps.md)

***

### IterativeRetrievalOptions

Re-exports [IterativeRetrievalOptions](/api/@graphorin/memory/interfaces/IterativeRetrievalOptions.md)

***

### IterativeRetrievalResult

Re-exports [IterativeRetrievalResult](/api/@graphorin/memory/interfaces/IterativeRetrievalResult.md)

***

### MAX\_ITERATIONS\_CEILING

Re-exports [MAX_ITERATIONS_CEILING](/api/@graphorin/memory/variables/MAX_ITERATIONS_CEILING.md)

***

### ndcgAtK

Re-exports [ndcgAtK](/api/@graphorin/memory/functions/ndcgAtK.md)

***

### parseGrade

Re-exports [parseGrade](/api/@graphorin/memory/functions/parseGrade.md)

***

### parseHypothetical

Re-exports [parseHypothetical](/api/@graphorin/memory/functions/parseHypothetical.md)

***

### parseQueryVariants

Re-exports [parseQueryVariants](/api/@graphorin/memory/functions/parseQueryVariants.md)

***

### pprActivation

Re-exports [pprActivation](/api/@graphorin/memory/functions/pprActivation.md)

***

### QUERY\_EXPANSION\_SYSTEM\_PROMPT

Re-exports [QUERY_EXPANSION_SYSTEM_PROMPT](/api/@graphorin/memory/variables/QUERY_EXPANSION_SYSTEM_PROMPT.md)

***

### QueryTransformer

Re-exports [QueryTransformer](/api/@graphorin/memory/interfaces/QueryTransformer.md)

***

### QueryTransformOptions

Re-exports [QueryTransformOptions](/api/@graphorin/memory/interfaces/QueryTransformOptions.md)

***

### RecalledMemoryExplanation

Re-exports [RecalledMemoryExplanation](/api/@graphorin/memory/interfaces/RecalledMemoryExplanation.md)

***

### RecallExplanation

Re-exports [RecallExplanation](/api/@graphorin/memory/interfaces/RecallExplanation.md)

***

### ReRanker

Re-exports [ReRanker](/api/@graphorin/memory/interfaces/ReRanker.md)

***

### ReRankOptions

Re-exports [ReRankOptions](/api/@graphorin/memory/interfaces/ReRankOptions.md)

***

### RETRIEVAL\_GRADE\_SYSTEM\_PROMPT

Re-exports [RETRIEVAL_GRADE_SYSTEM_PROMPT](/api/@graphorin/memory/variables/RETRIEVAL_GRADE_SYSTEM_PROMPT.md)

***

### RetrievalGrade

Re-exports [RetrievalGrade](/api/@graphorin/memory/interfaces/RetrievalGrade.md)

***

### RetrievalGradeOptions

Re-exports [RetrievalGradeOptions](/api/@graphorin/memory/interfaces/RetrievalGradeOptions.md)

***

### RetrievalGrader

Re-exports [RetrievalGrader](/api/@graphorin/memory/interfaces/RetrievalGrader.md)

***

### RRF\_DEFAULT\_K

Re-exports [RRF_DEFAULT_K](/api/@graphorin/memory/variables/RRF_DEFAULT_K.md)

***

### RRFReranker

Re-exports [RRFReranker](/api/@graphorin/memory/classes/RRFReranker.md)

***

### runIterativeRetrieval

Re-exports [runIterativeRetrieval](/api/@graphorin/memory/functions/runIterativeRetrieval.md)

***

### trustDiscount

Re-exports [trustDiscount](/api/@graphorin/memory/functions/trustDiscount.md)

***

### WeightedRRFReranker

Re-exports [WeightedRRFReranker](/api/@graphorin/memory/classes/WeightedRRFReranker.md)
