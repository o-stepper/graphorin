[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TodoItem

# Interface: TodoItem

Defined in: packages/core/src/types/run.ts:281

**`Stable`**

One item in the agent's structured plan. `status` drives both
the recitation rendering and progress reporting; `id` lets a
status-flip mutation target an item without rewriting the list.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | packages/core/src/types/run.ts:283 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/core/src/types/run.ts:282 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"pending"` \| `"in_progress"` | packages/core/src/types/run.ts:284 |
