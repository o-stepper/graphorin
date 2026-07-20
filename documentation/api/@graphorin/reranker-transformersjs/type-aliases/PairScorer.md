[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / PairScorer

# Type Alias: PairScorer

```ts
type PairScorer = (pairs, signal?) => Promise<number[]>;
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:81

**`Internal`**

Loaded scorer: rates each `(query, passage)` pair with a relevance
score in `[0, 1]`, aligned with the input pair order.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `pairs` | `ReadonlyArray`\&lt;\{ `text`: `string`; `text_pair`: `string`; \}\&gt; |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;`number`[]\&gt;
