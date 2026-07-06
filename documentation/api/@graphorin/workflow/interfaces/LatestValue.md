[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / LatestValue

# Interface: LatestValue\<T\>

Defined in: packages/core/dist/channels/channels.d.ts:31

Overwrite-on-write. Multiple writes within the same execution step
raise `MultiWriteError` (use `AnyValue` if collisions are acceptable).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | `T` | packages/core/dist/channels/channels.d.ts:33 |
| <a id="property-kind"></a> `kind` | `readonly` | `"latest-value"` | packages/core/dist/channels/channels.d.ts:32 |
