[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / InboundSanitizationWithClassifierOptions

# Interface: InboundSanitizationWithClassifierOptions

Defined in: [packages/tools/src/inbound/sanitize.ts:224](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L224)

Options for [applyInboundSanitizationWithClassifier](/api/@graphorin/tools/functions/applyInboundSanitizationWithClassifier.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | `string` | - | [packages/tools/src/inbound/sanitize.ts:225](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L225) |
| <a id="property-budgetms"></a> `budgetMs?` | `readonly` | `number` | - | [packages/tools/src/inbound/sanitize.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L232) |
| <a id="property-classifier"></a> `classifier?` | `readonly` | [`InjectionClassifier`](/api/@graphorin/tools/interfaces/InjectionClassifier.md) | B4 (D-12): optional pluggable injection classifier consulted AFTER the regex pass, on the already-sanitized body. A flagged verdict appends `classifier:<id>` to `patternsHit` (audit signal); the body is never modified by the classifier (it names no spans to strip). Errors are swallowed by the resilience contract - the regex outcome stands alone. | [packages/tools/src/inbound/sanitize.ts:241](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L241) |
| <a id="property-contentorigin"></a> `contentOrigin?` | `readonly` | `string` | - | [packages/tools/src/inbound/sanitize.ts:229](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L229) |
| <a id="property-failclosed"></a> `failClosed?` | `readonly` | `boolean` | - | [packages/tools/src/inbound/sanitize.ts:230](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L230) |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly [`ImperativePattern`](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md)[] | - | [packages/tools/src/inbound/sanitize.ts:231](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L231) |
| <a id="property-policy"></a> `policy` | `readonly` | [`InboundSanitizationPolicy`](/api/@graphorin/core/type-aliases/InboundSanitizationPolicy.md) | - | [packages/tools/src/inbound/sanitize.ts:226](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L226) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | [packages/tools/src/inbound/sanitize.ts:228](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L228) |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - | [packages/tools/src/inbound/sanitize.ts:227](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L227) |
