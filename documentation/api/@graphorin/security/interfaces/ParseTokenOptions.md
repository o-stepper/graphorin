[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ParseTokenOptions

# Interface: ParseTokenOptions

Defined in: packages/security/src/auth/token-format.ts:97

**`Stable`**

Options for `parseToken(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptenvironments"></a> `acceptEnvironments?` | `readonly` | readonly `string`[] | Override the accepted environments. Defaults to `TOKEN_ENVIRONMENTS`. An empty array is treated as "accept any non-empty lowercase ASCII label". | packages/security/src/auth/token-format.ts:105 |
| <a id="property-acceptprefix"></a> `acceptPrefix?` | `readonly` | `string` | Override the accepted prefix. Defaults to `DEFAULT_TOKEN_PREFIX`. | packages/security/src/auth/token-format.ts:99 |
