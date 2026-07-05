[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Reducer

# Interface: Reducer\&lt;T\&gt;

Defined in: packages/core/dist/channels/channels.d.ts:52

Fold writes via a user-provided `reduce` function. The reducer is
invoked left-to-right over the writes collected within an execution
step.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | `T` | packages/core/dist/channels/channels.d.ts:54 |
| <a id="property-kind"></a> `kind` | `readonly` | `"reducer"` | packages/core/dist/channels/channels.d.ts:53 |
| <a id="property-reduce"></a> `reduce` | `readonly` | (`prev`, `next`) => `T` | packages/core/dist/channels/channels.d.ts:55 |
