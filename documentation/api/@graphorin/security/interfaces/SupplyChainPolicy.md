[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SupplyChainPolicy

# Interface: SupplyChainPolicy

Defined in: packages/security/src/supply-chain/types.ts:122

Allow / deny / framework-denylist policy resolved from the operator
configuration.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowlist"></a> `allowlist?` | `readonly` | readonly `string`[] | - | packages/security/src/supply-chain/types.ts:123 |
| <a id="property-denylist"></a> `denylist?` | `readonly` | readonly `string`[] | - | packages/security/src/supply-chain/types.ts:124 |
| <a id="property-graphorindenylist"></a> `graphorinDenylist?` | `readonly` | `"off"` \| `"auto"` | `'auto'` is reserved for the post-MVP optional pull from a framework-curated denylist. The MVP only supports the operator- managed denylist; `'off'` is the only practical value. | packages/security/src/supply-chain/types.ts:130 |
