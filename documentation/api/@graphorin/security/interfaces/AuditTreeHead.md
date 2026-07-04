[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditTreeHead

# Interface: AuditTreeHead

Defined in: packages/security/src/audit/merkle.ts:111

Tree head of the audit log at a given size: the anchor unit for
checkpointing and proofs.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-lastseq"></a> `lastSeq` | `readonly` | `number` | `seq` of the newest covered entry (`0` for the empty log). | packages/security/src/audit/merkle.ts:117 |
| <a id="property-roothash"></a> `rootHash` | `readonly` | `string` | Hex Merkle root (`SHA-256`, RFC 6962). | packages/security/src/audit/merkle.ts:115 |
| <a id="property-size"></a> `size` | `readonly` | `number` | Number of leaves (audit entries) covered. | packages/security/src/audit/merkle.ts:113 |
