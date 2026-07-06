[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Stream

# Interface: Stream\<T\>

Defined in: packages/core/dist/channels/channels.d.ts:72

Append-only queue. Used for dynamic task creation via `Dispatch(...)`
and for application-defined event streams.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | readonly `T`[] | packages/core/dist/channels/channels.d.ts:75 |
| <a id="property-kind"></a> `kind` | `readonly` | `"stream"` | packages/core/dist/channels/channels.d.ts:73 |
| <a id="property-unique"></a> `unique?` | `readonly` | `boolean` | packages/core/dist/channels/channels.d.ts:74 |
