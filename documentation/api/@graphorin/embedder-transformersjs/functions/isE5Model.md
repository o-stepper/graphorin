[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-transformersjs](/api/@graphorin/embedder-transformersjs/index.md) / [](/api/@graphorin/embedder-transformersjs/README.md) / isE5Model

# Function: isE5Model()

```ts
function isE5Model(model): boolean;
```

Defined in: packages/embedder-transformersjs/src/index.ts:311

True when a model id belongs to the E5 family, which requires asymmetric
`query:` / `passage:` prefixes (PS-10). Matches an `e5` token bounded by a
path / dash / underscore so it covers `multilingual-e5-base`, `e5-large`,
`intfloat/e5-mistral`, etc. without false-matching unrelated names.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `model` | `string` |

## Returns

`boolean`
