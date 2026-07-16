[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SupplyChainAuditEvent

# Interface: SupplyChainAuditEvent

Defined in: [packages/security/src/supply-chain/audit-emitter.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit-emitter.ts#L45)

One audit event. The payload is intentionally minimal - never
carry credentials or token material; only safe metadata.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`SupplyChainAuditAction`](/api/@graphorin/security/type-aliases/SupplyChainAuditAction.md) | - | [packages/security/src/supply-chain/audit-emitter.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit-emitter.ts#L46) |
| <a id="property-actor"></a> `actor?` | `readonly` | [`SupplyChainAuditActor`](/api/@graphorin/security/interfaces/SupplyChainAuditActor.md) | - | [packages/security/src/supply-chain/audit-emitter.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit-emitter.ts#L53) |
| <a id="property-decision"></a> `decision` | `readonly` | [`SupplyChainAuditDecision`](/api/@graphorin/security/type-aliases/SupplyChainAuditDecision.md) | - | [packages/security/src/supply-chain/audit-emitter.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit-emitter.ts#L47) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | [packages/security/src/supply-chain/audit-emitter.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit-emitter.ts#L54) |
| <a id="property-source"></a> `source` | `readonly` | `string` | Always `'skills-supply-chain'`. | [packages/security/src/supply-chain/audit-emitter.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit-emitter.ts#L50) |
| <a id="property-target"></a> `target` | `readonly` | `string` | Stable identifier of the form `skill:<name>@<version>`. | [packages/security/src/supply-chain/audit-emitter.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit-emitter.ts#L52) |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | - | [packages/security/src/supply-chain/audit-emitter.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit-emitter.ts#L48) |
