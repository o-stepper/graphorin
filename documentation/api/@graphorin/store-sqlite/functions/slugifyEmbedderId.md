[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / slugifyEmbedderId

# Function: slugifyEmbedderId()

```ts
function slugifyEmbedderId(id): string;
```

Defined in: [packages/store-sqlite/src/embedding-meta-repo.ts:315](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/embedding-meta-repo.ts#L315)

Translates an `embedder_id` like `'transformersjs:Xenova/multilingual-e5-base@768'`
into a SQL-safe slug used in vec0 table names. Letters / digits stay,
everything else becomes `_`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

## Returns

`string`

## Stable
