[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / LatestValue

# Interface: LatestValue\&lt;T\&gt;

Defined in: [packages/core/src/channels/channels.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L46)

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
| <a id="property-default"></a> `default?` | `readonly` | `T` | [packages/core/src/channels/channels.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L48) |
| <a id="property-kind"></a> `kind` | `readonly` | `"latest-value"` | [packages/core/src/channels/channels.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L47) |
