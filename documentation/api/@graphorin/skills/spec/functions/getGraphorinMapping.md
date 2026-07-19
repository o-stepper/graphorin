[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [spec](/api/@graphorin/skills/spec/index.md) / getGraphorinMapping

# Function: getGraphorinMapping()

```ts
function getGraphorinMapping(field): 
  | GraphorinMappingEntry
  | undefined;
```

Defined in: packages/skills/src/spec/index.ts:125

**`Stable`**

Resolve the mapping entry for a `graphorin-*` field. Returns
`undefined` if the field is not known to the snapshot.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `field` | `string` |

## Returns

  \| [`GraphorinMappingEntry`](/api/@graphorin/skills/spec/interfaces/GraphorinMappingEntry.md)
  \| `undefined`
