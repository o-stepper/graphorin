[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LayerCandidate

# Interface: LayerCandidate

Defined in: packages/memory/src/context-engine/token-budget.ts:65

Single layer candidate fed to [allocate](/api/@graphorin/memory/functions/allocateTokenBudget.md). The `text` field
carries the rendered fragment; `cap` is the optional per-layer
upper bound (in tokens); `priority` overrides the default ladder
for advanced use cases.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cap"></a> `cap?` | `readonly` | `number` | packages/memory/src/context-engine/token-budget.ts:68 |
| <a id="property-id"></a> `id` | `readonly` | [`LayerId`](/api/@graphorin/memory/type-aliases/LayerId.md) | packages/memory/src/context-engine/token-budget.ts:66 |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | packages/memory/src/context-engine/token-budget.ts:69 |
| <a id="property-text"></a> `text` | `readonly` | `string` | packages/memory/src/context-engine/token-budget.ts:67 |
