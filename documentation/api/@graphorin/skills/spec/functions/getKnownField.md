[**Graphorin API reference v0.15.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [spec](/api/@graphorin/skills/spec/index.md) / getKnownField

# Function: getKnownField()

```ts
function getKnownField(field): 
  | KnownFieldEntry
  | undefined;
```

Defined in: packages/skills/src/spec/index.ts:115

**`Stable`**

Resolve a known-field entry by name. Returns `undefined` if the
field is not part of the upstream specification.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `field` | `string` |

## Returns

  \| [`KnownFieldEntry`](/api/@graphorin/skills/spec/interfaces/KnownFieldEntry.md)
  \| `undefined`
