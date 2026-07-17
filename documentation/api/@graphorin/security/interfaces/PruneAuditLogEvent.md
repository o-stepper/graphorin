[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PruneAuditLogEvent

# Interface: PruneAuditLogEvent

Defined in: [packages/security/src/audit/prune.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L74)

Structured shape of the single log event emitted per prune run.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-before"></a> `before` | `readonly` | `number` | [packages/security/src/audit/prune.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L80) |
| <a id="property-deleted"></a> `deleted` | `readonly` | `number` | [packages/security/src/audit/prune.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L77) |
| <a id="property-firstsurvivingseq"></a> `firstSurvivingSeq?` | `readonly` | `number` | [packages/security/src/audit/prune.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L78) |
| <a id="property-level"></a> `level` | `readonly` | `"info"` | [packages/security/src/audit/prune.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L75) |
| <a id="property-message"></a> `message` | `readonly` | `string` | [packages/security/src/audit/prune.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L76) |
| <a id="property-retain"></a> `retain` | `readonly` | `number` | [packages/security/src/audit/prune.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/prune.ts#L79) |
