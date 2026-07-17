[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / collect

# Function: collect()

```ts
function collect<T>(source, signal?): Promise<T[]>;
```

Defined in: [packages/core/src/utils/streams.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/streams.ts#L25)

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

## Stable
