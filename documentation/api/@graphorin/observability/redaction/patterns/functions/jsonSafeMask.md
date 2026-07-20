[**Graphorin API reference v0.13.5**](../../../../../index.md)

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

Defined in: packages/observability/src/redaction/patterns.ts:268

**`Stable`**

Grammar-preserving mask placement. When the matched span occupies a bare
JSON *value* position - the nearest non-whitespace neighbour on the left
is `:` / `,` / `[` (or the start of the text) and on the right `,` / `}`
/ `]` (or the end of the text) - the mask is returned wrapped in double
quotes, so masking a raw numeric leaf (`{"card":4111111111111111}`)
yields a document that still parses (`{"card":"[REDACTED creditcard]"}`).
Everywhere else (prose, CSV, inside a JSON string leaf) the mask is
returned unchanged. The text is never parsed, so numeric lexemes outside
the match keep their exact source form.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |
| `matchIndex` | `number` |
| `matchLength` | `number` |
| `mask` | `string` |

## Returns

`string`
