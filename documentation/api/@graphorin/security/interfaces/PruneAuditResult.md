[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PruneAuditResult

# Interface: PruneAuditResult

Defined in: packages/security/src/audit/prune.ts:88

**`Stable`**

Result of `pruneAudit(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-deleted"></a> `deleted` | `readonly` | `number` | - | packages/security/src/audit/prune.ts:89 |
| <a id="property-firstsurvivingseq"></a> `firstSurvivingSeq?` | `readonly` | `number` | Sequence number of the first surviving entry, or `undefined` if empty. | packages/security/src/audit/prune.ts:91 |
