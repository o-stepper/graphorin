[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / defaultMemoryPointMatcher

# Function: defaultMemoryPointMatcher()

```ts
function defaultMemoryPointMatcher(options?): MemoryPointMatcher;
```

Defined in: packages/evals/src/scorers/memory/util.ts:166

**`Stable`**

The operation scorers' default matcher: symmetric token F1 OR
directional gold coverage. F1 keeps short-vs-short matching strict;
the coverage leg stops verbose-but-correct memories from scoring as
missed, hallucinated, and omitted at once (deep-retest 0.13.7 P2).
Like every lexical matcher it cannot read negation or tense -
callers needing semantic matching supply their own
[MemoryPointMatcher](/api/@graphorin/evals/type-aliases/MemoryPointMatcher.md) (an embedding or judge-backed one).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | \{ `minGoldCoverage?`: `number`; `minTokenF1?`: `number`; \} |
| `options.minGoldCoverage?` | `number` |
| `options.minTokenF1?` | `number` |

## Returns

[`MemoryPointMatcher`](/api/@graphorin/evals/type-aliases/MemoryPointMatcher.md)
