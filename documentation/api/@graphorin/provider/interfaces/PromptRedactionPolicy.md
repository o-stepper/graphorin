[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / PromptRedactionPolicy

# Interface: PromptRedactionPolicy

Defined in: packages/provider/src/middleware/with-redaction.ts:87

**`Stable`**

Full prompt-redaction policy.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | `"throw"` \| `"redact"` \| `"block-and-prompt-user"` | Action on detection. Defaults to `'redact'`. | packages/provider/src/middleware/with-redaction.ts:91 |
| <a id="property-bytrustclass"></a> `byTrustClass?` | `readonly` | `Partial`\<`Record`\<[`LocalProviderTrust`](/api/@graphorin/provider/type-aliases/LocalProviderTrust.md), `Partial`\&lt;`PromptRedactionPolicy`\&gt;\>\> | Per-trust-class override block. | packages/provider/src/middleware/with-redaction.ts:101 |
| <a id="property-detectsecretvalue"></a> `detectSecretValue?` | `readonly` | `boolean` | Detect `SecretValue` instances anywhere in the request. | packages/provider/src/middleware/with-redaction.ts:97 |
| <a id="property-failclosed"></a> `failClosed?` | `readonly` | `boolean` | Throw on the first hit instead of redacting in-place. | packages/provider/src/middleware/with-redaction.ts:93 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`message`, `meta?`) => `void` | Optional logger override. Defaults to `console.warn`. | packages/provider/src/middleware/with-redaction.ts:105 |
| <a id="property-onviolation"></a> `onViolation?` | `readonly` | (`violation`) => `void` | Sanitised violation hook (audit emission lives downstream). | packages/provider/src/middleware/with-redaction.ts:103 |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly [`RedactionPattern`](/api/@graphorin/observability/redaction/patterns/interfaces/RedactionPattern.md)[] | Pattern catalogue. Defaults to the 14 built-in patterns. | packages/provider/src/middleware/with-redaction.ts:89 |
| <a id="property-scanscope"></a> `scanScope?` | `readonly` | [`PromptRedactionScanScope`](/api/@graphorin/provider/type-aliases/PromptRedactionScanScope.md) | Range of fields scanned. Defaults to `'all'`. | packages/provider/src/middleware/with-redaction.ts:95 |
| <a id="property-stripcachecontrolonhit"></a> `stripCacheControlOnHit?` | `readonly` | `boolean` | Strip Anthropic-shape `cache_control` markers on hit. | packages/provider/src/middleware/with-redaction.ts:99 |
| <a id="property-trustclassoverride"></a> `trustClassOverride?` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/provider/type-aliases/LocalProviderTrust.md) | Test hook - synthetic trust class. | packages/provider/src/middleware/with-redaction.ts:107 |
