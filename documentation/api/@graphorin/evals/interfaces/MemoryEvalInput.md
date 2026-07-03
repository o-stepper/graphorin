[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryEvalInput

# Interface: MemoryEvalInput

Defined in: evals/src/loaders/memory-eval.ts:60

Input handed to the memory system under test for one eval case.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ability"></a> `ability?` | `readonly` | [`MemoryEvalAbility`](/api/@graphorin/evals/type-aliases/MemoryEvalAbility.md) | Mapped ability ([MemoryEvalAbility](/api/@graphorin/evals/type-aliases/MemoryEvalAbility.md)); the raw category lives in metadata. | evals/src/loaders/memory-eval.ts:71 |
| <a id="property-askedat"></a> `askedAt?` | `readonly` | `string` | When the question is asked. Drives temporal / knowledge-update reasoning; dataset-native string (not necessarily ISO-8601). | evals/src/loaders/memory-eval.ts:69 |
| <a id="property-haystacksessions"></a> `haystackSessions` | `readonly` | readonly [`MemoryEvalSession`](/api/@graphorin/evals/interfaces/MemoryEvalSession.md)[] | Prior sessions to ingest before the question is asked. | evals/src/loaders/memory-eval.ts:62 |
| <a id="property-question"></a> `question` | `readonly` | `string` | The question to answer from memory. | evals/src/loaders/memory-eval.ts:64 |
