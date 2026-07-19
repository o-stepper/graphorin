[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / anyValue

# Function: anyValue()

```ts
function anyValue<T>(opts?): AnyValue<T>;
```

Defined in: [packages/core/dist/channels/channels.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts)

**`Stable`**

Construct an `AnyValue` channel.

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

[`AnyValue`](/api/@graphorin/workflow/interfaces/AnyValue.md)\&lt;`T`\&gt;
