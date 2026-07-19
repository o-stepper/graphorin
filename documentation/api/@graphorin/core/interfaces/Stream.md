[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Stream

# Interface: Stream\&lt;T\&gt;

Defined in: packages/core/src/channels/channels.ts:91

**`Stable`**

Append-only queue. Used for dynamic task creation via `Dispatch(...)`
and for application-defined event streams.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | readonly `T`[] | packages/core/src/channels/channels.ts:94 |
| <a id="property-kind"></a> `kind` | `readonly` | `"stream"` | packages/core/src/channels/channels.ts:92 |
| <a id="property-unique"></a> `unique?` | `readonly` | `boolean` | packages/core/src/channels/channels.ts:93 |
