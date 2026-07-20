[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / pickRerankerModel

# Function: pickRerankerModel()

```ts
function pickRerankerModel(locale): string;
```

Defined in: packages/reranker-transformersjs/src/model-selection.ts:35

**`Stable`**

Pick a reranker model from the agent locale. Pure function so callers
(and tests) can pre-resolve the choice without constructing the
reranker.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `locale` | `string` \| `undefined` |

## Returns

`string`
