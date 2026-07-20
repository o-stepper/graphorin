[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / MemoryReviewResult

# Interface: MemoryReviewResult

Defined in: packages/cli/src/commands/memory.ts:825

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-episodes"></a> `episodes` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | packages/cli/src/commands/memory.ts:835 |
| <a id="property-error"></a> `error?` | `readonly` | \{ `code`: `string`; `message`: `string`; \} | Set when a `--promote <id>` request failed. Carried on the payload so `--json` consumers receive a structured failure on stdout instead of an empty document; the process exit code is the machine signal. | packages/cli/src/commands/memory.ts:833 |
| `error.code` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:833 |
| `error.message` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:833 |
| <a id="property-facts"></a> `facts` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | packages/cli/src/commands/memory.ts:834 |
| <a id="property-insights"></a> `insights` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | packages/cli/src/commands/memory.ts:836 |
| <a id="property-procedures"></a> `procedures` | `readonly` | readonly [`MemoryReviewItem`](/api/@graphorin/cli/interfaces/MemoryReviewItem.md)[] | - | packages/cli/src/commands/memory.ts:837 |
| <a id="property-promoted"></a> `promoted?` | `readonly` | \{ `id`: `string`; `type`: `string`; \} | Set when `--promote <id>` succeeded. | packages/cli/src/commands/memory.ts:827 |
| `promoted.id` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:827 |
| `promoted.type` | `readonly` | `string` | - | packages/cli/src/commands/memory.ts:827 |
