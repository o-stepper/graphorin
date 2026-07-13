[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Stream

# Interface: Stream\&lt;T\&gt;

Defined in: [packages/core/src/channels/channels.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L91)

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
| <a id="property-default"></a> `default?` | `readonly` | readonly `T`[] | [packages/core/src/channels/channels.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L94) |
| <a id="property-kind"></a> `kind` | `readonly` | `"stream"` | [packages/core/src/channels/channels.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L92) |
| <a id="property-unique"></a> `unique?` | `readonly` | `boolean` | [packages/core/src/channels/channels.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L93) |
