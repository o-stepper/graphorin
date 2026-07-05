[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TodoItem

# Interface: TodoItem

Defined in: packages/core/src/types/run.ts:154

One item in the agent's structured plan (D6). `status` drives both
the recitation rendering and progress reporting; `id` lets a
status-flip mutation target an item without rewriting the list.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | packages/core/src/types/run.ts:156 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/core/src/types/run.ts:155 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"pending"` \| `"in_progress"` | packages/core/src/types/run.ts:157 |
