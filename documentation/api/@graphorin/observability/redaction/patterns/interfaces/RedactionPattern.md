[**Graphorin API reference v0.13.7**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/patterns](/api/@graphorin/observability/redaction/patterns/index.md) / RedactionPattern

# Interface: RedactionPattern

Defined in: packages/observability/src/redaction/patterns.ts:58

**`Stable`**

One entry in the redaction catalogue.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-category"></a> `category` | `readonly` | [`PatternCategory`](/api/@graphorin/observability/redaction/patterns/type-aliases/PatternCategory.md) | - | packages/observability/src/redaction/patterns.ts:60 |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | packages/observability/src/redaction/patterns.ts:61 |
| <a id="property-mask"></a> `mask?` | `readonly` | `string` | Replacement string used when `mode === 'mask'`. | packages/observability/src/redaction/patterns.ts:64 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/observability/src/redaction/patterns.ts:59 |
| <a id="property-optin"></a> `optIn?` | `readonly` | `boolean` | Optional opt-in flag. When `true` the pattern is **not** active by default; operators must add it to `enabledPatterns` explicitly. Used by the IPv4 / IPv6 patterns because raw IPs frequently appear in non-PII log lines (host headers, debug traces, …). | packages/observability/src/redaction/patterns.ts:83 |
| <a id="property-regex"></a> `regex` | `readonly` | `RegExp` | - | packages/observability/src/redaction/patterns.ts:62 |
| <a id="property-verify"></a> `verify?` | `readonly` | (`match`) => `boolean` | Optional per-match predicate. When present, a regex hit is only treated as a real match - and masked - when this returns `true` for the matched substring. Every catalogue consumer honours it: the OTLP `RedactionValidator`, the `withRedaction` provider middleware (both the request scrub and the streaming response scan), and user-supplied patterns may carry their own predicate. Used by the `creditcard` pattern to require a valid Luhn checksum plus a major-network leading digit so look-alike digit runs (epoch-ms timestamps, order ids, serialized floats) are not corrupted. | packages/observability/src/redaction/patterns.ts:76 |
