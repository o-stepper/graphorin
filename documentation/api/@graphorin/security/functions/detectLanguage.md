[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / detectLanguage

# Function: detectLanguage()

```ts
function detectLanguage(text): DetectedLanguage;
```

Defined in: packages/security/src/guardrails/builtins/language-whitelist.ts:125

**`Stable`**

Default language detector. The detector scores text by:

 - The proportion of ASCII vs Cyrillic / extended-Latin
   characters; tells English / Russian / Ukrainian apart from
   Latin-but-not-English families.
 - A small, well-known stopword list per language; the language
   with the highest stopword hit count wins.

The detector returns `'unknown'` when no signal exceeds a
conservative threshold. Operators who need higher accuracy should
override `detect`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |

## Returns

[`DetectedLanguage`](/api/@graphorin/security/type-aliases/DetectedLanguage.md)
