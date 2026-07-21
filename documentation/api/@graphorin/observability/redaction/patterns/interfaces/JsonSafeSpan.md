[**Graphorin API reference v0.13.10**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/patterns](/api/@graphorin/observability/redaction/patterns/index.md) / JsonSafeSpan

# Interface: JsonSafeSpan

Defined in: packages/observability/src/redaction/patterns.ts:263

**`Stable`**

A replacement decision from [jsonSafeSpan](/api/@graphorin/observability/redaction/patterns/functions/jsonSafeSpan.md): replace
`source.slice(start, end)` with `text`. `start` normally equals the
match index; it moves one lexeme left only when a leading minus sign
has to be absorbed so a signed numeric leaf stays parseable.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-end"></a> `end` | `readonly` | `number` | packages/observability/src/redaction/patterns.ts:265 |
| <a id="property-start"></a> `start` | `readonly` | `number` | packages/observability/src/redaction/patterns.ts:264 |
| <a id="property-text"></a> `text` | `readonly` | `string` | packages/observability/src/redaction/patterns.ts:266 |
