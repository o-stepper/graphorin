[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / stream

# Function: stream()

```ts
function stream<T>(opts?): Stream<T>;
```

Defined in: packages/core/dist/channels/channels.d.ts:134

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
