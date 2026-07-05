[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / languageWhitelist

# Function: languageWhitelist()

```ts
function languageWhitelist<TValue>(opts): InputGuardrail<TValue>;
```

Defined in: packages/security/src/guardrails/builtins/language-whitelist.ts:69

Construct the language-whitelist guardrail.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`LanguageWhitelistOptions`](/api/@graphorin/security/interfaces/LanguageWhitelistOptions.md) |

## Returns

[`InputGuardrail`](/api/@graphorin/security/type-aliases/InputGuardrail.md)\&lt;`TValue`\&gt;

## Stable
