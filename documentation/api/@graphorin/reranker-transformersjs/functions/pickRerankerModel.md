[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / pickRerankerModel

# Function: pickRerankerModel()

```ts
function pickRerankerModel(locale): string;
```

Defined in: [packages/reranker-transformersjs/src/model-selection.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-transformersjs/src/model-selection.ts#L35)

Pick a reranker model from the agent locale. Pure function so callers
(and tests) can pre-resolve the choice without constructing the
reranker.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `locale` | `string` \| `undefined` |

## Returns

`string`

## Stable
