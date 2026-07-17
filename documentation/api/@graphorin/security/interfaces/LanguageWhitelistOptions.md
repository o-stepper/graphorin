[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / LanguageWhitelistOptions

# Interface: LanguageWhitelistOptions

Defined in: [packages/security/src/guardrails/builtins/language-whitelist.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/language-whitelist.ts#L46)

Options for `languageWhitelist(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptunknown"></a> `acceptUnknown?` | `readonly` | `boolean` | Treat `'unknown'` as accepted. Defaults to `true` so the guardrail does not over-block multilingual input. | [packages/security/src/guardrails/builtins/language-whitelist.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/language-whitelist.ts#L61) |
| <a id="property-action"></a> `action?` | `readonly` | `"block"` \| `"warn"` | Action on rejection. Defaults to `'block'`. | [packages/security/src/guardrails/builtins/language-whitelist.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/language-whitelist.ts#L54) |
| <a id="property-allowed"></a> `allowed` | `readonly` | readonly [`DetectedLanguage`](/api/@graphorin/security/type-aliases/DetectedLanguage.md)[] | - | [packages/security/src/guardrails/builtins/language-whitelist.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/language-whitelist.ts#L47) |
| <a id="property-detect"></a> `detect?` | `readonly` | (`text`) => [`DetectedLanguage`](/api/@graphorin/security/type-aliases/DetectedLanguage.md) | Override the built-in detector. Useful when the deployment ships a more accurate detector (e.g. CLD3 via FFI). | [packages/security/src/guardrails/builtins/language-whitelist.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/language-whitelist.ts#L52) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Override guardrail name. | [packages/security/src/guardrails/builtins/language-whitelist.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/language-whitelist.ts#L56) |
