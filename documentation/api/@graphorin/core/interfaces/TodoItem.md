[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TodoItem

# Interface: TodoItem

Defined in: [packages/core/src/types/run.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L232)

One item in the agent's structured plan (D6). `status` drives both
the recitation rendering and progress reporting; `id` lets a
status-flip mutation target an item without rewriting the list.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | [packages/core/src/types/run.ts:234](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L234) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/core/src/types/run.ts:233](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L233) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"pending"` \| `"in_progress"` | [packages/core/src/types/run.ts:235](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L235) |
