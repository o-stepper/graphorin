[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LayerAllocation

# Interface: LayerAllocation

Defined in: packages/memory/src/context-engine/token-budget.ts:87

**`Stable`**

Output of [allocate](/api/@graphorin/memory/functions/allocateTokenBudget.md) - one entry per surviving layer in
priority order, plus a `truncated` flag for observability.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-droppedtokens"></a> `droppedTokens` | `readonly` | `number` | packages/memory/src/context-engine/token-budget.ts:92 |
| <a id="property-id"></a> `id` | `readonly` | [`LayerId`](/api/@graphorin/memory/type-aliases/LayerId.md) | packages/memory/src/context-engine/token-budget.ts:88 |
| <a id="property-text"></a> `text` | `readonly` | `string` | packages/memory/src/context-engine/token-budget.ts:89 |
| <a id="property-tokens"></a> `tokens` | `readonly` | `number` | packages/memory/src/context-engine/token-budget.ts:90 |
| <a id="property-truncated"></a> `truncated` | `readonly` | `boolean` | packages/memory/src/context-engine/token-budget.ts:91 |
