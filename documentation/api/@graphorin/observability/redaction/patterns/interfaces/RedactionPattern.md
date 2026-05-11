[**Graphorin API reference v0.1.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/patterns](/api/@graphorin/observability/redaction/patterns/index.md) / RedactionPattern

# Interface: RedactionPattern

Defined in: packages/observability/src/redaction/patterns.ts:58

One entry in the redaction catalogue.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-category"></a> `category` | `readonly` | [`PatternCategory`](/api/@graphorin/observability/redaction/patterns/type-aliases/PatternCategory.md) | - | packages/observability/src/redaction/patterns.ts:60 |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | packages/observability/src/redaction/patterns.ts:61 |
| <a id="property-mask"></a> `mask?` | `readonly` | `string` | Replacement string used when `mode === 'mask'`. | packages/observability/src/redaction/patterns.ts:64 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/observability/src/redaction/patterns.ts:59 |
| <a id="property-optin"></a> `optIn?` | `readonly` | `boolean` | Optional opt-in flag. When `true` the pattern is **not** active by default; operators must add it to `enabledPatterns` explicitly. Used by the IPv4 / IPv6 patterns because raw IPs frequently appear in non-PII log lines (host headers, debug traces, …). | packages/observability/src/redaction/patterns.ts:71 |
| <a id="property-regex"></a> `regex` | `readonly` | `RegExp` | - | packages/observability/src/redaction/patterns.ts:62 |
