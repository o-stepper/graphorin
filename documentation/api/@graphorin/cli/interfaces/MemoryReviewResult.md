[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryReviewResult

# Interface: MemoryReviewResult

Defined in: [packages/cli/src/commands/memory.ts:809](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L809)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-episodes"></a> `episodes` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | [packages/cli/src/commands/memory.ts:813](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L813) |
| <a id="property-facts"></a> `facts` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | [packages/cli/src/commands/memory.ts:812](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L812) |
| <a id="property-insights"></a> `insights` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | [packages/cli/src/commands/memory.ts:814](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L814) |
| <a id="property-procedures"></a> `procedures` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | [packages/cli/src/commands/memory.ts:815](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L815) |
| <a id="property-promoted"></a> `promoted?` | `readonly` | \{ `id`: `string`; `type`: `string`; \} | Set when `--promote <id>` succeeded. | [packages/cli/src/commands/memory.ts:811](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L811) |
| `promoted.id` | `readonly` | `string` | - | [packages/cli/src/commands/memory.ts:811](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L811) |
| `promoted.type` | `readonly` | `string` | - | [packages/cli/src/commands/memory.ts:811](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L811) |
