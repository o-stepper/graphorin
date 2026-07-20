[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / QueryTransformer

# Interface: QueryTransformer

Defined in: packages/memory/src/search/query-transform.ts:47

**`Stable`**

Pluggable query-transformation seam consumed by
`SemanticMemory.search(..., { multiQuery, hyde })`. The built-in
provider-backed implementation lives in
[createProviderQueryTransformer](/api/@graphorin/memory/functions/createProviderQueryTransformer.md); advanced callers can supply a
bespoke one (e.g. a deterministic synonym expander) to
`new SemanticMemory({ queryTransformer })`.

Implementations MUST degrade gracefully - return `[]` / `null` rather
than throw - so a transform failure never breaks recall.

## Methods

### expand()

```ts
expand(
   query, 
   count, 
options?): Promise<readonly string[]>;
```

Defined in: packages/memory/src/search/query-transform.ts:53

Rewrite a query into up to `count` **additional** reworded variants
(the original query is retained by the caller). Returns `[]` when
transformation is unavailable or the model returns nothing usable.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `count` | `number` |
| `options?` | [`QueryTransformOptions`](/api/@graphorin/memory/interfaces/QueryTransformOptions.md) |

#### Returns

`Promise`\&lt;readonly `string`[]\&gt;

***

### hypothetical()

```ts
hypothetical(query, options?): Promise<string | null>;
```

Defined in: packages/memory/src/search/query-transform.ts:63

Generate a single short hypothetical-answer passage to embed (HyDE),
or `null` when unavailable. The caller embeds the passage and fuses
its vector neighbours into the result.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `options?` | [`QueryTransformOptions`](/api/@graphorin/memory/interfaces/QueryTransformOptions.md) |

#### Returns

`Promise`\&lt;`string` \| `null`\&gt;
