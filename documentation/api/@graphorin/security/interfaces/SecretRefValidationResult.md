[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretRefValidationResult

# Interface: SecretRefValidationResult

Defined in: packages/security/src/secrets/secret-ref.ts:72

**`Stable`**

Result of `validateSecretRefs(...)`. Lists every problem found during
a recursive walk over a config object.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-issues"></a> `issues` | `readonly` | readonly \{ `error`: [`SecretRefParseError`](/api/@graphorin/security/classes/SecretRefParseError.md); `path`: readonly (`string` \| `number`)[]; `raw`: `unknown`; \}[] | packages/security/src/secrets/secret-ref.ts:74 |
| <a id="property-ok"></a> `ok` | `readonly` | `boolean` | packages/security/src/secrets/secret-ref.ts:73 |
