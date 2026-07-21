[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / computeEntriesDigest

# Function: computeEntriesDigest()

```ts
function computeEntriesDigest(entries): string;
```

Defined in: pricing/src/snapshot/bundled.ts:375

**`Internal`**

Compute a deterministic SHA-256 of the entries. Sorting the entry
keys before serialisation keeps the digest stable across Node
versions / object-property-iteration orderings.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `entries` | readonly [`ModelPrice`](/api/@graphorin/pricing/interfaces/ModelPrice.md)[] |

## Returns

`string`
