[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditInclusionProof

# Interface: AuditInclusionProof

Defined in: packages/security/src/audit/merkle.ts:159

**`Stable`**

Inclusion proof that the entry at `seq` is covered by `head`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-leafindex"></a> `leafIndex` | `readonly` | `number` | 0-based leaf index within the tree of `treeSize` leaves. | packages/security/src/audit/merkle.ts:162 |
| <a id="property-path"></a> `path` | `readonly` | readonly `string`[] | Bottom-up audit path, hex node hashes. | packages/security/src/audit/merkle.ts:165 |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | - | packages/security/src/audit/merkle.ts:160 |
| <a id="property-treesize"></a> `treeSize` | `readonly` | `number` | - | packages/security/src/audit/merkle.ts:163 |
