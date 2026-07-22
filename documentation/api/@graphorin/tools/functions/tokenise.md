[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / tokenise

# Function: tokenise()

```ts
function tokenise(text, stopwords?): string[];
```

Defined in: packages/tools/src/registry/bm25.ts:46

Tokenise a body - lowercase, alphanumeric runs only, drop stopwords.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `text` | `string` | `undefined` |
| `stopwords` | `ReadonlySet`\&lt;`string`\&gt; | `DEFAULT_STOPWORDS` |

## Returns

`string`[]
