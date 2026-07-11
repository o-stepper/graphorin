[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SupplyChainPolicy

# Interface: SupplyChainPolicy

Defined in: [packages/security/src/supply-chain/types.ts:122](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L122)

Allow / deny / framework-denylist policy resolved from the operator
configuration.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowlist"></a> `allowlist?` | `readonly` | readonly `string`[] | - | [packages/security/src/supply-chain/types.ts:123](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L123) |
| <a id="property-denylist"></a> `denylist?` | `readonly` | readonly `string`[] | - | [packages/security/src/supply-chain/types.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L124) |
| <a id="property-graphorindenylist"></a> `graphorinDenylist?` | `readonly` | `"off"` \| `"auto"` | `'auto'` is reserved for the post-MVP optional pull from a framework-curated denylist. The MVP only supports the operator- managed denylist; `'off'` is the only practical value. | [packages/security/src/supply-chain/types.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L130) |
| <a id="property-precedence"></a> `precedence?` | `readonly` | `"allow-wins"` \| `"deny-wins"` | Conflict resolution when a package matches BOTH the allowlist and a deny list. `'allow-wins'` (the default) lets the allowlist short-circuit, so an operator can deny a whole scope yet allow specific exceptions inside it. `'deny-wins'` evaluates the deny lists first, so an explicit denylist entry is never overridden by a broad allowlist glob - the safer posture when the denylist is the security-critical list. SPL-20: defaults to `'allow-wins'` (byte-identical to prior behaviour). | [packages/security/src/supply-chain/types.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L141) |
