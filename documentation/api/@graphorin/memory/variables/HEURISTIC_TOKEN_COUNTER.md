[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / HEURISTIC\_TOKEN\_COUNTER

# Variable: HEURISTIC\_TOKEN\_COUNTER

```ts
const HEURISTIC_TOKEN_COUNTER: ContextTokenCounter;
```

Defined in: [packages/memory/src/context-engine/token-counter.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/token-counter.ts#L54)

Built-in heuristic counter - chars/4 for Latin-ish text plus one
token per dense-script (CJK/kana/hangul) character (CE-13). Stable
default when the operator does not pass a real [TokenCounter](/api/@graphorin/core/interfaces/TokenCounter.md).

## Stable
