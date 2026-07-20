[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PruneAuditLogEvent

# Interface: PruneAuditLogEvent

Defined in: packages/security/src/audit/prune.ts:74

**`Stable`**

Structured shape of the single log event emitted per prune run.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before` | `readonly` | `number` | packages/security/src/audit/prune.ts:80 |
| <a id="property-deleted"></a> `deleted` | `readonly` | `number` | packages/security/src/audit/prune.ts:77 |
| <a id="property-firstsurvivingseq"></a> `firstSurvivingSeq?` | `readonly` | `number` | packages/security/src/audit/prune.ts:78 |
| <a id="property-level"></a> `level` | `readonly` | `"info"` | packages/security/src/audit/prune.ts:75 |
| <a id="property-message"></a> `message` | `readonly` | `string` | packages/security/src/audit/prune.ts:76 |
| <a id="property-retain"></a> `retain` | `readonly` | `number` | packages/security/src/audit/prune.ts:79 |
