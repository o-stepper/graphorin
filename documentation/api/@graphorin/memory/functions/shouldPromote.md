[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / shouldPromote

# Function: shouldPromote()

```ts
function shouldPromote(
   candidate, 
   policy, 
   nowMs): boolean;
```

Defined in: packages/memory/src/consolidator/promotion.ts:92

**`Stable`**

The pure verdict: does this candidate clear every threshold at
`nowMs`? No I/O, no clock reads.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `candidate` | [`PromotionCandidate`](/api/@graphorin/memory/interfaces/PromotionCandidate.md) |
| `policy` | `ResolvedPromotionPolicy` |
| `nowMs` | `number` |

## Returns

`boolean`
