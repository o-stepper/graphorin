[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / shouldPromote

# Function: shouldPromote()

```ts
function shouldPromote(
   candidate, 
   policy, 
   nowMs): boolean;
```

Defined in: [packages/memory/src/consolidator/promotion.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/promotion.ts#L92)

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

## Stable
