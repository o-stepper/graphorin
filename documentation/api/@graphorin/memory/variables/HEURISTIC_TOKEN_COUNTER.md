[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / HEURISTIC\_TOKEN\_COUNTER

# Variable: HEURISTIC\_TOKEN\_COUNTER

```ts
const HEURISTIC_TOKEN_COUNTER: ContextTokenCounter;
```

Defined in: packages/memory/src/context-engine/token-counter.ts:38

Built-in heuristic counter — `Math.ceil(text.length / 4)`. Stable
default when the operator does not pass a real [TokenCounter](/api/@graphorin/core/interfaces/TokenCounter.md).

## Stable
