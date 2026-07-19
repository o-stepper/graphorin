[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / ephemeral

# Function: ephemeral()

```ts
function ephemeral<T>(opts?): Ephemeral<T>;
```

Defined in: packages/core/dist/channels/channels.d.ts:151

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

[`Ephemeral`](/api/@graphorin/workflow/interfaces/Ephemeral.md)\&lt;`T`\&gt;
