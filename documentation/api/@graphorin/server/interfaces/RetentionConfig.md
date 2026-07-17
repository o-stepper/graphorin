[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RetentionConfig

# Interface: RetentionConfig

Defined in: [packages/server/src/runtime/retention.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L46)

Mirror of the `config.retention` section of
`ServerConfigSpec`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auditdays"></a> `auditDays?` | `readonly` | `number` | [packages/server/src/runtime/retention.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L57) |
| <a id="property-consolidatorrunsdays"></a> `consolidatorRunsDays` | `readonly` | `number` | [packages/server/src/runtime/retention.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L50) |
| <a id="property-dlqexhausteddays"></a> `dlqExhaustedDays` | `readonly` | `number` | [packages/server/src/runtime/retention.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L51) |
| <a id="property-enabled"></a> `enabled` | `readonly` | `boolean` | [packages/server/src/runtime/retention.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L47) |
| <a id="property-idempotency"></a> `idempotency` | `readonly` | `boolean` | [packages/server/src/runtime/retention.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L52) |
| <a id="property-intervalms"></a> `intervalMs` | `readonly` | `number` | [packages/server/src/runtime/retention.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L48) |
| <a id="property-memoryhistorydays"></a> `memoryHistoryDays?` | `readonly` | `number` | [packages/server/src/runtime/retention.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L55) |
| <a id="property-sessionsclosedonly"></a> `sessionsClosedOnly` | `readonly` | `boolean` | [packages/server/src/runtime/retention.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L54) |
| <a id="property-sessionsdays"></a> `sessionsDays?` | `readonly` | `number` | [packages/server/src/runtime/retention.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L53) |
| <a id="property-spansdays"></a> `spansDays` | `readonly` | `number` | [packages/server/src/runtime/retention.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L49) |
| <a id="property-workflowthreadsdays"></a> `workflowThreadsDays?` | `readonly` | `number` | [packages/server/src/runtime/retention.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/runtime/retention.ts#L56) |
