[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ParseTokenOptions

# Interface: ParseTokenOptions

Defined in: [packages/security/src/auth/token-format.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/token-format.ts#L97)

Options for `parseToken(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptenvironments"></a> `acceptEnvironments?` | `readonly` | readonly `string`[] | Override the accepted environments. Defaults to `TOKEN_ENVIRONMENTS`. An empty array is treated as "accept any non-empty lowercase ASCII label". | [packages/security/src/auth/token-format.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/token-format.ts#L105) |
| <a id="property-acceptprefix"></a> `acceptPrefix?` | `readonly` | `string` | Override the accepted prefix. Defaults to `DEFAULT_TOKEN_PREFIX`. | [packages/security/src/auth/token-format.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/token-format.ts#L99) |
