[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SupplyChainAuditEvent

# Interface: SupplyChainAuditEvent

Defined in: packages/security/src/supply-chain/audit-emitter.ts:45

One audit event. The payload is intentionally minimal - never
carry credentials or token material; only safe metadata.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`SupplyChainAuditAction`](/api/@graphorin/security/type-aliases/SupplyChainAuditAction.md) | - | packages/security/src/supply-chain/audit-emitter.ts:46 |
| <a id="property-actor"></a> `actor?` | `readonly` | [`SupplyChainAuditActor`](/api/@graphorin/security/interfaces/SupplyChainAuditActor.md) | - | packages/security/src/supply-chain/audit-emitter.ts:53 |
| <a id="property-decision"></a> `decision` | `readonly` | [`SupplyChainAuditDecision`](/api/@graphorin/security/type-aliases/SupplyChainAuditDecision.md) | - | packages/security/src/supply-chain/audit-emitter.ts:47 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/security/src/supply-chain/audit-emitter.ts:54 |
| <a id="property-source"></a> `source` | `readonly` | `string` | Always `'skills-supply-chain'`. | packages/security/src/supply-chain/audit-emitter.ts:50 |
| <a id="property-target"></a> `target` | `readonly` | `string` | Stable identifier of the form `skill:<name>@<version>`. | packages/security/src/supply-chain/audit-emitter.ts:52 |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | - | packages/security/src/supply-chain/audit-emitter.ts:48 |
