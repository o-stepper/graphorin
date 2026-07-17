[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / MemoryQaHallucinationOptions

# Interface: MemoryQaHallucinationOptions

Defined in: [packages/evals/src/scorers/memory/qa.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/qa.ts#L24)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxscore"></a> `maxScore?` | `readonly` | `number` | Default `10`. | [packages/evals/src/scorers/memory/qa.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/qa.ts#L30) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. Default `'memory-qa-hallucination'`. | [packages/evals/src/scorers/memory/qa.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/qa.ts#L28) |
| <a id="property-passthreshold"></a> `passThreshold?` | `readonly` | `number` | Pass threshold (raw score). Default `Math.ceil(maxScore * 0.7)`. | [packages/evals/src/scorers/memory/qa.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/qa.ts#L32) |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | The judge provider (evals-04: never the system under test). | [packages/evals/src/scorers/memory/qa.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/memory/qa.ts#L26) |
