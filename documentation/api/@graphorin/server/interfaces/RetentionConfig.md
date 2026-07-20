[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RetentionConfig

# Interface: RetentionConfig

Defined in: packages/server/src/runtime/retention.ts:46

**`Stable`**

Mirror of the `config.retention` section of
`ServerConfigSpec`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auditdays"></a> `auditDays?` | `readonly` | `number` | packages/server/src/runtime/retention.ts:57 |
| <a id="property-consolidatorrunsdays"></a> `consolidatorRunsDays` | `readonly` | `number` | packages/server/src/runtime/retention.ts:50 |
| <a id="property-dlqexhausteddays"></a> `dlqExhaustedDays` | `readonly` | `number` | packages/server/src/runtime/retention.ts:51 |
| <a id="property-enabled"></a> `enabled` | `readonly` | `boolean` | packages/server/src/runtime/retention.ts:47 |
| <a id="property-idempotency"></a> `idempotency` | `readonly` | `boolean` | packages/server/src/runtime/retention.ts:52 |
| <a id="property-intervalms"></a> `intervalMs` | `readonly` | `number` | packages/server/src/runtime/retention.ts:48 |
| <a id="property-memoryhistorydays"></a> `memoryHistoryDays?` | `readonly` | `number` | packages/server/src/runtime/retention.ts:55 |
| <a id="property-sessionsclosedonly"></a> `sessionsClosedOnly` | `readonly` | `boolean` | packages/server/src/runtime/retention.ts:54 |
| <a id="property-sessionsdays"></a> `sessionsDays?` | `readonly` | `number` | packages/server/src/runtime/retention.ts:53 |
| <a id="property-spansdays"></a> `spansDays` | `readonly` | `number` | packages/server/src/runtime/retention.ts:49 |
| <a id="property-workflowthreadsdays"></a> `workflowThreadsDays?` | `readonly` | `number` | packages/server/src/runtime/retention.ts:56 |
