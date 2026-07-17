[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / RerankerDtype

# Type Alias: RerankerDtype

```ts
type RerankerDtype = "fp32" | "fp16" | "q8" | "q4";
```

Defined in: [packages/reranker-transformersjs/src/cross-encoder.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-transformersjs/src/cross-encoder.ts#L25)

Numeric dtype hint. Default: `'q8'` on the CPU device, `'fp16'` on
accelerated devices - see [defaultRerankerDtype](/api/@graphorin/reranker-transformersjs/functions/defaultRerankerDtype.md).

## Stable
