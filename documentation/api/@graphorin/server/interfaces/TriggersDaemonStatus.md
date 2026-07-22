[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TriggersDaemonStatus

# Interface: TriggersDaemonStatus

Defined in: packages/server/src/triggers/daemon.ts:26

**`Stable`**

Snapshot exposed via [TriggersDaemon.status](/api/@graphorin/server/interfaces/TriggersDaemon.md#status) + the
`/v1/health` aggregator. Counts split by `disabled` so the health
endpoint can flag a deployment that disabled every cron trigger.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active"></a> `active` | `readonly` | `number` | - | packages/server/src/triggers/daemon.ts:28 |
| <a id="property-deferred"></a> `deferred` | `readonly` | `number` | - | packages/server/src/triggers/daemon.ts:30 |
| <a id="property-disabled"></a> `disabled` | `readonly` | `number` | - | packages/server/src/triggers/daemon.ts:29 |
| <a id="property-lastfireat"></a> `lastFireAt?` | `readonly` | `string` | Last fire timestamp across the entire pool (ISO-8601). | packages/server/src/triggers/daemon.ts:37 |
| <a id="property-orphaned"></a> `orphaned?` | `readonly` | `number` | Persisted rows with no live declaration in this process - they never fire until re-registered or pruned. | packages/server/src/triggers/daemon.ts:35 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | - | packages/server/src/triggers/daemon.ts:27 |
