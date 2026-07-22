[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / normalizeForMatching

# Function: normalizeForMatching()

```ts
function normalizeForMatching(text): string;
```

Defined in: packages/security/src/guardrails/normalize.ts:25

**`Stable`**

Fold text to a match-friendly form: NFKC (collapses fullwidth /
compatibility homoglyphs), strip zero-width characters, lowercase.
Whitespace and punctuation are PRESERVED (unlike the taint ledger's
alphanumeric-only fold) so word-boundary regexes keep working.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

`string`
