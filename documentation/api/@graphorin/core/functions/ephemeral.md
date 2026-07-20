[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ephemeral

# Function: ephemeral()

```ts
function ephemeral<T>(opts?): Ephemeral<T>;
```

Defined in: packages/core/src/channels/channels.ts:202

**`Stable`**

Construct an `Ephemeral` channel.

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

[`Ephemeral`](/api/@graphorin/core/interfaces/Ephemeral.md)\&lt;`T`\&gt;
