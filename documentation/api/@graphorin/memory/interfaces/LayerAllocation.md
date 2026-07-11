[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LayerAllocation

# Interface: LayerAllocation

Defined in: [packages/memory/src/context-engine/token-budget.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L87)

Output of [allocate](/api/@graphorin/memory/functions/allocateTokenBudget.md) - one entry per surviving layer in
priority order, plus a `truncated` flag for observability.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-droppedtokens"></a> `droppedTokens` | `readonly` | `number` | [packages/memory/src/context-engine/token-budget.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L92) |
| <a id="property-id"></a> `id` | `readonly` | [`LayerId`](/api/@graphorin/memory/type-aliases/LayerId.md) | [packages/memory/src/context-engine/token-budget.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L88) |
| <a id="property-text"></a> `text` | `readonly` | `string` | [packages/memory/src/context-engine/token-budget.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L89) |
| <a id="property-tokens"></a> `tokens` | `readonly` | `number` | [packages/memory/src/context-engine/token-budget.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L90) |
| <a id="property-truncated"></a> `truncated` | `readonly` | `boolean` | [packages/memory/src/context-engine/token-budget.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-budget.ts#L91) |
