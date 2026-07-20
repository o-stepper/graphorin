[**Graphorin API reference v0.13.7**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/patterns](/api/@graphorin/observability/redaction/patterns/index.md) / jsonSafeSpan

# Function: jsonSafeSpan()

```ts
function jsonSafeSpan(
   source, 
   matchIndex, 
   matchLength, 
   mask): JsonSafeSpan;
```

Defined in: packages/observability/src/redaction/patterns.ts:292

**`Stable`**

Grammar-preserving mask placement. When the matched span occupies a bare
JSON *value* position - the nearest non-whitespace neighbour on the left
is `:` / `,` / `[` (or the start of the text) and on the right `,` / `}`
/ `]` (or the end of the text) - the mask is wrapped in double quotes,
so masking a raw numeric leaf (`{"card":4111111111111111}`) yields a
document that still parses (`{"card":"[REDACTED creditcard]"}`). A
leading minus sign is part of the value position: for
`{"card":-4111111111111111}` the returned span absorbs the sign
(`start` moves to the `-`), because a mask emitted after a stranded
sign (`-"[REDACTED ...]"`) would not parse. Everywhere else (prose,
CSV, inside a JSON string leaf) the mask is returned unquoted and the
span covers exactly the match. The text is never parsed, so lexemes
outside the returned span keep their exact source form.

Ambiguity note: a text consisting solely of the match (plus
insignificant whitespace) is indistinguishable from a single-value
JSON document, so the mask is quoted even when the caller meant plain
prose. That direction is safe - the redacted document parses in the
JSON reading and leaks nothing in the prose reading.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |
| `matchIndex` | `number` |
| `matchLength` | `number` |
| `mask` | `string` |

## Returns

[`JsonSafeSpan`](/api/@graphorin/observability/redaction/patterns/interfaces/JsonSafeSpan.md)
