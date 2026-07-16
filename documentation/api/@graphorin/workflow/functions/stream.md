[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / stream

# Function: stream()

```ts
function stream<T>(opts?): Stream<T>;
```

Defined in: [packages/core/dist/channels/channels.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts)

Construct a `Stream` channel.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `default?`: readonly `T`[]; `unique?`: `boolean`; \} |
| `opts.default?` | readonly `T`[] |
| `opts.unique?` | `boolean` |

## Returns

[`Stream`](/api/@graphorin/workflow/interfaces/Stream.md)\&lt;`T`\&gt;

## Stable
