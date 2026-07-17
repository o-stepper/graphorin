[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / computeEntriesDigest

# Function: computeEntriesDigest()

```ts
function computeEntriesDigest(entries): string;
```

Defined in: [packages/pricing/src/snapshot/bundled.ts:276](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/snapshot/bundled.ts#L276)

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
