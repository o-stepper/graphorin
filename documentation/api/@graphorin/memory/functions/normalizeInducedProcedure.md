[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / normalizeInducedProcedure

# Function: normalizeInducedProcedure()

```ts
function normalizeInducedProcedure(raw): 
  | InducedProcedure
  | null;
```

Defined in: packages/memory/src/consolidator/phases/induce.ts:199

**`Internal`**

Normalize a raw induced procedure: trim + drop empty entries, cap step
count, and reconcile the variable list with the placeholders actually used
in the steps. Returns `null` when no usable steps remain (nothing to
induce).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | \{ `steps`: readonly `string`[]; `successCriteria`: readonly `string`[]; `title`: `string`; `variables`: readonly `string`[]; \} |
| `raw.steps` | readonly `string`[] |
| `raw.successCriteria` | readonly `string`[] |
| `raw.title` | `string` |
| `raw.variables` | readonly `string`[] |

## Returns

  \| [`InducedProcedure`](/api/@graphorin/memory/interfaces/InducedProcedure.md)
  \| `null`
