[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / latestValue

# Function: latestValue()

```ts
function latestValue<T>(opts?): LatestValue<T>;
```

Defined in: packages/core/src/channels/channels.ts:124

**`Stable`**

Construct a `LatestValue` channel.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `default?`: `T`; \} |
| `opts.default?` | `T` |

## Returns

[`LatestValue`](/api/@graphorin/core/interfaces/LatestValue.md)\&lt;`T`\&gt;
