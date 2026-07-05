[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryReviewResult

# Interface: MemoryReviewResult

Defined in: packages/cli/src/commands/memory.ts:687

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-episodes"></a> `episodes` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | packages/cli/src/commands/memory.ts:691 |
| <a id="property-facts"></a> `facts` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | packages/cli/src/commands/memory.ts:690 |
| <a id="property-insights"></a> `insights` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | packages/cli/src/commands/memory.ts:692 |
| <a id="property-procedures"></a> `procedures` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | packages/cli/src/commands/memory.ts:693 |
| <a id="property-promoted"></a> `promoted?` | `readonly` | \{ `id`: `string`; `type`: `string`; \} | Set when `--promote <id>` succeeded. | packages/cli/src/commands/memory.ts:689 |
| `promoted.id` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:689 |
| `promoted.type` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:689 |
