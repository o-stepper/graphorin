[**Graphorin API reference v0.9.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/imperative-patterns](/api/@graphorin/observability/redaction/imperative-patterns/index.md) / ScanResult

# Interface: ScanResult

Defined in: [packages/observability/src/redaction/imperative-patterns.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L186)

Compiled scan helper. Returns the list of pattern names that fired
AND the number of bytes the strip would remove if applied. Bounded
by the budget hint - when exceeded, returns `null` to let the caller
apply the best-effort `'detect-failed'` annotation.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-bytesmatched"></a> `bytesMatched` | `readonly` | `number` | [packages/observability/src/redaction/imperative-patterns.ts:188](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L188) |
| <a id="property-hits"></a> `hits` | `readonly` | readonly \{ `matchCount`: `number`; `pattern`: `string`; \}[] | [packages/observability/src/redaction/imperative-patterns.ts:187](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L187) |
| <a id="property-scandurationus"></a> `scanDurationUs` | `readonly` | `number` | [packages/observability/src/redaction/imperative-patterns.ts:189](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L189) |
