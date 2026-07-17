[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MAX\_ITERATIONS\_CEILING

# Variable: MAX\_ITERATIONS\_CEILING

```ts
const MAX_ITERATIONS_CEILING: 5 = 5;
```

Defined in: [packages/memory/src/search/iterative.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L46)

Absolute clamp on total retrieval passes, applied regardless of the
caller's `maxIterations` - a latency guardrail so a mis-configured
caller can never unbound the loop.
