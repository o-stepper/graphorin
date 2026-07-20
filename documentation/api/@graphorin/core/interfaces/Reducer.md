[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Reducer

# Interface: Reducer\&lt;T\&gt;

Defined in: packages/core/src/channels/channels.ts:69

**`Stable`**

Fold writes via a user-provided `reduce` function. The reducer is
invoked left-to-right over the writes collected within an execution
step.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | `T` | packages/core/src/channels/channels.ts:71 |
| <a id="property-kind"></a> `kind` | `readonly` | `"reducer"` | packages/core/src/channels/channels.ts:70 |
| <a id="property-reduce"></a> `reduce` | `readonly` | (`prev`, `next`) => `T` | packages/core/src/channels/channels.ts:72 |
