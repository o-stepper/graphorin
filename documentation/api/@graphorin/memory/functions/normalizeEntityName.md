[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / normalizeEntityName

# Function: normalizeEntityName()

```ts
function normalizeEntityName(name): string;
```

Defined in: packages/memory/src/graph/entity-resolver.ts:91

**`Stable`**

Fold an entity surface form into a canonical lexical key: Unicode
NFKC, lowercased, internal whitespace collapsed, surrounding
punctuation stripped. `"  Anna S. "` → `"anna s"`. Returns `''` for a
name with no letters/digits (the resolver treats that as "no entity").

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

## Returns

`string`
