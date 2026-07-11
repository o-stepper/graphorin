[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / explainRecall

# Function: explainRecall()

```ts
function explainRecall<TRecord>(hits, opts): RecallExplanation;
```

Defined in: [packages/memory/src/search/explain.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/explain.ts#L78)

Build a [RecallExplanation](/api/@graphorin/memory/interfaces/RecallExplanation.md) from a ranked hit list. Pure and
deterministic: it surfaces whatever per-signal scores the hybrid
pipeline left on each [MemoryHit.signals](/api/@graphorin/core/interfaces/MemoryHit.md#property-signals) (FTS, vector, RRF,
decay, future graph-hop terms) without re-deriving them, so the
explanation always matches what actually drove the ranking. Hits are
assumed to be in final-rank order (as returned by `search`).

## Type Parameters

| Type Parameter |
| ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hits` | readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;`TRecord`\&gt;[] |
| `opts` | \{ `query`: `string`; `rerankerId`: `string`; \} |
| `opts.query` | `string` |
| `opts.rerankerId` | `string` |

## Returns

[`RecallExplanation`](/api/@graphorin/memory/interfaces/RecallExplanation.md)

## Stable
