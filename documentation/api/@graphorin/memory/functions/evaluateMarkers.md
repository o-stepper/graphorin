[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / evaluateMarkers

# Function: evaluateMarkers()

```ts
function evaluateMarkers(text, patterns): LocaleMatch;
```

Defined in: packages/memory/src/conflict/locale-packs/types.ts:119

**`Stable`**

Apply a list of patterns to the supplied text and return the
highest-confidence match (first match wins on ties). Surfaced for
unit tests; the pipeline calls this internally.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `patterns` | readonly [`LocalePatternEntry`](/api/@graphorin/memory/interfaces/LocalePatternEntry.md)[] |

## Returns

[`LocaleMatch`](/api/@graphorin/memory/interfaces/LocaleMatch.md)
