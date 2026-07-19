[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryOperationsEvalInput

# Interface: MemoryOperationsEvalInput

Defined in: packages/evals/src/loaders/memory-eval.ts:123

**`Stable`**

Input handed to the memory system under test for one
operation-level eval case. The gold labels ride the input (not
`Case.expected`) so a single observation type can serve the
extraction, update and QA stages.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ability"></a> `ability?` | `readonly` | [`MemoryEvalAbility`](/api/@graphorin/evals/type-aliases/MemoryEvalAbility.md) | Mapped ability ([MemoryEvalAbility](/api/@graphorin/evals/type-aliases/MemoryEvalAbility.md)); the raw category lives in metadata. | packages/evals/src/loaders/memory-eval.ts:137 |
| <a id="property-askedat"></a> `askedAt?` | `readonly` | `string` | When the question is asked; dataset-native string. | packages/evals/src/loaders/memory-eval.ts:135 |
| <a id="property-goldpoints"></a> `goldPoints` | `readonly` | readonly [`MemoryGoldPoint`](/api/@graphorin/evals/interfaces/MemoryGoldPoint.md)[] | Per-operation ground truth for this case. | packages/evals/src/loaders/memory-eval.ts:127 |
| <a id="property-haystacksessions"></a> `haystackSessions` | `readonly` | readonly [`MemoryEvalSession`](/api/@graphorin/evals/interfaces/MemoryEvalSession.md)[] | Sessions to ingest before memory is observed. | packages/evals/src/loaders/memory-eval.ts:125 |
| <a id="property-question"></a> `question?` | `readonly` | `string` | QA-stage probe question (absent on operations-stage cases). | packages/evals/src/loaders/memory-eval.ts:129 |
| <a id="property-referenceanswer"></a> `referenceAnswer?` | `readonly` | `string` | Reference answer for the QA probe. | packages/evals/src/loaders/memory-eval.ts:131 |
| <a id="property-unanswerable"></a> `unanswerable?` | `readonly` | `boolean` | `true` when the correct QA behaviour is to abstain. | packages/evals/src/loaders/memory-eval.ts:133 |
