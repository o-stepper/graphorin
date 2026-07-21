[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / runIterativeRetrieval

# Function: runIterativeRetrieval()

```ts
function runIterativeRetrieval<H>(
   query, 
   deps, 
options?): Promise<IterativeRetrievalResult<H>>;
```

Defined in: packages/memory/src/search/iterative.ts:426

**`Stable`**

Run the gated grade-then-reformulate loop.

Flow: assess difficulty → retrieve (pass 1) → if not hard *or* no
grader, return single-shot → else grade; if sufficient, return; if
weak and a reformulation is offered and the cap is not hit, retrieve
again (widened) and re-grade; otherwise **abstain**.

## Type Parameters

| Type Parameter |
| ------ |
| `H` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `deps` | [`IterativeRetrievalDeps`](/api/@graphorin/memory/interfaces/IterativeRetrievalDeps.md)\&lt;`H`\&gt; |
| `options` | [`IterativeRetrievalOptions`](/api/@graphorin/memory/interfaces/IterativeRetrievalOptions.md) |

## Returns

`Promise`\<[`IterativeRetrievalResult`](/api/@graphorin/memory/interfaces/IterativeRetrievalResult.md)\&lt;`H`\&gt;\>
