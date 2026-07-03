[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-transformersjs](/api/@graphorin/embedder-transformersjs/index.md) / FeatureExtractor

# Type Alias: FeatureExtractor

```ts
type FeatureExtractor = (texts, options?) => Promise<{
  data: Float32Array;
  dims: readonly number[];
  tolist?: unknown;
}>;
```

Defined in: packages/embedder-transformersjs/src/index.ts:84

**`Internal`**

Tiny structural shape of `@huggingface/transformers`' feature-
extraction pipeline used by this package. Declared inline so the
embedder does not import the heavy peer at build time.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `texts` | `string` \| readonly `string`[] |
| `options?` | \{ `normalize?`: `boolean`; `pooling?`: [`Pooling`](/api/@graphorin/embedder-transformersjs/type-aliases/Pooling.md); `signal?`: `AbortSignal`; \} |
| `options.normalize?` | `boolean` |
| `options.pooling?` | [`Pooling`](/api/@graphorin/embedder-transformersjs/type-aliases/Pooling.md) |
| `options.signal?` | `AbortSignal` |

## Returns

`Promise`\<\{
  `data`: `Float32Array`;
  `dims`: readonly `number`[];
  `tolist?`: `unknown`;
\}\>
