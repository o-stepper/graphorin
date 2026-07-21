[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / stream

# Function: stream()

```ts
function stream<T>(opts?): Stream<T>;
```

Defined in: packages/core/src/channels/channels.ts:171

**`Stable`**

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

[`Stream`](/api/@graphorin/core/interfaces/Stream.md)\&lt;`T`\&gt;
