[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PruneAuditLogEvent

# Interface: PruneAuditLogEvent

Defined in: packages/security/src/audit/prune.ts:51

Structured shape of the single log event emitted per prune run.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before` | `readonly` | `number` | packages/security/src/audit/prune.ts:57 |
| <a id="property-deleted"></a> `deleted` | `readonly` | `number` | packages/security/src/audit/prune.ts:54 |
| <a id="property-firstsurvivingseq"></a> `firstSurvivingSeq?` | `readonly` | `number` | packages/security/src/audit/prune.ts:55 |
| <a id="property-level"></a> `level` | `readonly` | `"info"` | packages/security/src/audit/prune.ts:52 |
| <a id="property-message"></a> `message` | `readonly` | `string` | packages/security/src/audit/prune.ts:53 |
| <a id="property-retain"></a> `retain` | `readonly` | `number` | packages/security/src/audit/prune.ts:56 |
