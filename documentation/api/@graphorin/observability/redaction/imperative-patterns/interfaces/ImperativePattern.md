[**Graphorin API reference v0.7.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/imperative-patterns](/api/@graphorin/observability/redaction/imperative-patterns/index.md) / ImperativePattern

# Interface: ImperativePattern

Defined in: [packages/observability/src/redaction/imperative-patterns.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L50)

One entry in the imperative-pattern catalogue. The shape mirrors
`BUILT_IN_PATTERNS` so consumers can share scan / replace
machinery, but the fields are typed as imperative-only so the two
catalogues do not accidentally merge.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | [packages/observability/src/redaction/imperative-patterns.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L52) |
| <a id="property-mask"></a> `mask` | `readonly` | `string` | Replacement string applied by the `'detect-and-strip*'` policies. | [packages/observability/src/redaction/imperative-patterns.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L65) |
| <a id="property-name"></a> `name` | `readonly` | \| [`ImperativePatternName`](/api/@graphorin/observability/redaction/imperative-patterns/type-aliases/ImperativePatternName.md) \| `string` & \{ \} | - | [packages/observability/src/redaction/imperative-patterns.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L51) |
| <a id="property-prefilter"></a> `prefilter` | `readonly` | readonly `string`[] | Cheap substring prefilter applied before the regex; if the body does not contain any of the prefilter substrings the regex is skipped entirely. The prefilter is case-insensitive. | [packages/observability/src/redaction/imperative-patterns.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L58) |
| <a id="property-regex"></a> `regex` | `readonly` | `RegExp` | Full regex applied when the prefilter matches. Always carries the `g` and `i` flags; the catalogue construction validates this. | [packages/observability/src/redaction/imperative-patterns.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L63) |
