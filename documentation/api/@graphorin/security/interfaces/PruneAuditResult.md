[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PruneAuditResult

# Interface: PruneAuditResult

Defined in: [packages/security/src/audit/prune.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L88)

Result of `pruneAudit(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-deleted"></a> `deleted` | `readonly` | `number` | - | [packages/security/src/audit/prune.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L89) |
| <a id="property-firstsurvivingseq"></a> `firstSurvivingSeq?` | `readonly` | `number` | Sequence number of the first surviving entry, or `undefined` if empty. | [packages/security/src/audit/prune.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L91) |
