[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostSnapshot

# Interface: CostSnapshot

Defined in: packages/observability/src/cost/types.ts:45

Snapshot returned by [CostTracker.usage](/api/@graphorin/observability/interfaces/CostTracker.md#usage).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-bymodel"></a> `byModel` | `readonly` | readonly \{ `callCount`: `number`; `completionTokens`: `number`; `cost`: [`Cost`](/api/@graphorin/core/interfaces/Cost.md) \| `null`; `model`: `string`; `promptTokens`: `number`; `reasoningTokens`: `number`; \}[] | packages/observability/src/cost/types.ts:52 |
| <a id="property-callcount"></a> `callCount` | `readonly` | `number` | packages/observability/src/cost/types.ts:50 |
| <a id="property-completiontokens"></a> `completionTokens` | `readonly` | `number` | packages/observability/src/cost/types.ts:48 |
| <a id="property-cost"></a> `cost` | `readonly` | [`Cost`](/api/@graphorin/core/interfaces/Cost.md) \| `null` | packages/observability/src/cost/types.ts:51 |
| <a id="property-prompttokens"></a> `promptTokens` | `readonly` | `number` | packages/observability/src/cost/types.ts:47 |
| <a id="property-reasoningtokens"></a> `reasoningTokens` | `readonly` | `number` | packages/observability/src/cost/types.ts:49 |
| <a id="property-totaltokens"></a> `totalTokens` | `readonly` | `number` | packages/observability/src/cost/types.ts:46 |
