[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RedactionViolation

# Interface: RedactionViolation

Defined in: packages/observability/src/redaction/types.ts:29

**`Stable`**

Sanitized record describing a single redaction event. Never carries
the secret value itself; only metadata that is safe to log.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attribute"></a> `attribute?` | `readonly` | `string` | - | packages/observability/src/redaction/types.ts:36 |
| <a id="property-declaredtier"></a> `declaredTier?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Tier declared by the upstream caller. | packages/observability/src/redaction/types.ts:42 |
| <a id="property-origin"></a> `origin?` | `readonly` | `string` | - | packages/observability/src/redaction/types.ts:38 |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly `string`[] | Pattern names that fired (if applicable). | packages/observability/src/redaction/types.ts:40 |
| <a id="property-reason"></a> `reason` | `readonly` | \| `"sensitivity-tier-exceeded"` \| `"pii-pattern-match"` \| `"secret-pattern-match"` \| `"unredacted-secret-value"` \| `"invalid-input"` | - | packages/observability/src/redaction/types.ts:30 |
| <a id="property-spantype"></a> `spanType?` | `readonly` | `string` | - | packages/observability/src/redaction/types.ts:37 |
