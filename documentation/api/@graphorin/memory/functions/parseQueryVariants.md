[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / parseQueryVariants

# Function: parseQueryVariants()

```ts
function parseQueryVariants(text, max): readonly string[];
```

Defined in: packages/memory/src/search/query-transform.ts:157

**`Stable`**

Parse the variant-generation model output into a deduped, capped list
of reworded queries. Tolerates a JSON array, a `{ "variants": [...] }`
/ `{ "queries": [...] }` wrapper, fenced blocks, and (as a last
resort) a newline / numbered list - so a chatty model never breaks
recall. Empty strings and case-insensitive duplicates are dropped;
the result is capped at `max`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` \| `undefined` |
| `max` | `number` |

## Returns

readonly `string`[]
