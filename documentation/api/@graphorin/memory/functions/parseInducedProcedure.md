[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / parseInducedProcedure

# Function: parseInducedProcedure()

```ts
function parseInducedProcedure(text): 
  | InducedProcedure
  | null;
```

Defined in: packages/memory/src/consolidator/phases/induce.ts:179

**`Internal`**

Parse the induction response into an [InducedProcedure](/api/@graphorin/memory/interfaces/InducedProcedure.md), tolerating
chatty / fenced output. Returns `null` when absent / unparseable / it
yields no steps. **Never throws on model output** - only normalizes.

The returned `variables` are reconciled with the steps: every `{name}`
placeholder actually present in the steps is guaranteed to appear, so the
abstraction is grounded in the procedure rather than in a model-declared
list that may drift from it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` \| `undefined` |

## Returns

  \| [`InducedProcedure`](/api/@graphorin/memory/interfaces/InducedProcedure.md)
  \| `null`
