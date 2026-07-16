[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryReviewResult

# Interface: MemoryReviewResult

Defined in: [packages/cli/src/commands/memory.ts:825](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L825)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-episodes"></a> `episodes` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | [packages/cli/src/commands/memory.ts:829](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L829) |
| <a id="property-facts"></a> `facts` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | [packages/cli/src/commands/memory.ts:828](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L828) |
| <a id="property-insights"></a> `insights` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | [packages/cli/src/commands/memory.ts:830](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L830) |
| <a id="property-procedures"></a> `procedures` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | [packages/cli/src/commands/memory.ts:831](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L831) |
| <a id="property-promoted"></a> `promoted?` | `readonly` | \{ `id`: `string`; `type`: `string`; \} | Set when `--promote <id>` succeeded. | [packages/cli/src/commands/memory.ts:827](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L827) |
| `promoted.id` | `readonly` | `string` | - | [packages/cli/src/commands/memory.ts:827](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L827) |
| `promoted.type` | `readonly` | `string` | - | [packages/cli/src/commands/memory.ts:827](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/memory.ts#L827) |
