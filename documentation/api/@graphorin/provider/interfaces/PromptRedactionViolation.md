[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / PromptRedactionViolation

# Interface: PromptRedactionViolation

Defined in: packages/provider/src/middleware/with-redaction.ts:61

**`Stable`**

Sanitized record handed to `onViolation`. Carries metadata only;
never the matched value.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | `"throw"` \| `"redact"` \| `"block-and-prompt-user"` | packages/provider/src/middleware/with-redaction.ts:67 |
| <a id="property-fieldpath"></a> `fieldPath` | `readonly` | `string` | packages/provider/src/middleware/with-redaction.ts:63 |
| <a id="property-matchlength"></a> `matchLength` | `readonly` | `number` | packages/provider/src/middleware/with-redaction.ts:65 |
| <a id="property-patternname"></a> `patternName` | `readonly` | `string` | packages/provider/src/middleware/with-redaction.ts:62 |
| <a id="property-role"></a> `role?` | `readonly` | `string` | packages/provider/src/middleware/with-redaction.ts:64 |
| <a id="property-trustclass"></a> `trustClass?` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/provider/type-aliases/LocalProviderTrust.md) | packages/provider/src/middleware/with-redaction.ts:66 |
