[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / parseHypothetical

# Function: parseHypothetical()

```ts
function parseHypothetical(text): string | null;
```

Defined in: packages/memory/src/search/query-transform.ts:182

**`Stable`**

Parse the HyDE model output into a single passage, or `null` when the
model returned nothing usable. Strips a fenced block and trims.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` \| `undefined` |

## Returns

`string` \| `null`
