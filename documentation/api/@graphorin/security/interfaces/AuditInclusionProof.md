[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditInclusionProof

# Interface: AuditInclusionProof

Defined in: [packages/security/src/audit/merkle.ts:159](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L159)

Inclusion proof that the entry at `seq` is covered by `head`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-leafindex"></a> `leafIndex` | `readonly` | `number` | 0-based leaf index within the tree of `treeSize` leaves. | [packages/security/src/audit/merkle.ts:162](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L162) |
| <a id="property-path"></a> `path` | `readonly` | readonly `string`[] | Bottom-up audit path, hex node hashes. | [packages/security/src/audit/merkle.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L165) |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | - | [packages/security/src/audit/merkle.ts:160](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L160) |
| <a id="property-treesize"></a> `treeSize` | `readonly` | `number` | - | [packages/security/src/audit/merkle.ts:163](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L163) |
