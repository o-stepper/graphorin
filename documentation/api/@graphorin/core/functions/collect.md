[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / collect

# Function: collect()

```ts
function collect<T>(source, signal?): Promise<T[]>;
```

Defined in: packages/core/src/utils/streams.ts:25

**`Stable`**

Drain an `AsyncIterable` into an array.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `AsyncIterable`\&lt;`T`\&gt; |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;`T`[]\&gt;
