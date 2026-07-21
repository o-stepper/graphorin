[**Graphorin API reference v0.13.11**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/patterns](/api/@graphorin/observability/redaction/patterns/index.md) / jsonSafeMask

# Function: jsonSafeMask()

```ts
function jsonSafeMask(
   source, 
   matchIndex, 
   matchLength, 
   mask): string;
```

Defined in: packages/observability/src/redaction/patterns.ts:340

**`Stable`**

String-returning wrapper around [jsonSafeSpan](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeSpan.md) for callers that
replace exactly the matched span. Because its signature cannot widen
the replaced region, it CANNOT absorb the leading minus of a signed
numeric leaf - for `{"card":-4111111111111111}` it returns the plain
unquoted mask (its historical behaviour), which leaves the document
unparseable. Prefer [jsonSafeSpan](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeSpan.md) in new code; this wrapper is
kept for custom catalogues that adopted it in 0.13.4. The same
whole-text ambiguity documented on [jsonSafeSpan](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeSpan.md) applies.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |
| `matchIndex` | `number` |
| `matchLength` | `number` |
| `mask` | `string` |

## Returns

`string`
