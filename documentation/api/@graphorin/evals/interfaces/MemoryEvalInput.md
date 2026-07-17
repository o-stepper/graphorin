[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryEvalInput

# Interface: MemoryEvalInput

Defined in: [packages/evals/src/loaders/memory-eval.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L68)

Input handed to the memory system under test for one eval case.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ability"></a> `ability?` | `readonly` | [`MemoryEvalAbility`](/api/@graphorin/evals/type-aliases/MemoryEvalAbility.md) | Mapped ability ([MemoryEvalAbility](/api/@graphorin/evals/type-aliases/MemoryEvalAbility.md)); the raw category lives in metadata. | [packages/evals/src/loaders/memory-eval.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L79) |
| <a id="property-askedat"></a> `askedAt?` | `readonly` | `string` | When the question is asked. Drives temporal / knowledge-update reasoning; dataset-native string (not necessarily ISO-8601). | [packages/evals/src/loaders/memory-eval.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L77) |
| <a id="property-haystacksessions"></a> `haystackSessions` | `readonly` | readonly [`MemoryEvalSession`](/api/@graphorin/evals/interfaces/MemoryEvalSession.md)[] | Prior sessions to ingest before the question is asked. | [packages/evals/src/loaders/memory-eval.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L70) |
| <a id="property-question"></a> `question` | `readonly` | `string` | The question to answer from memory. | [packages/evals/src/loaders/memory-eval.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/loaders/memory-eval.ts#L72) |
