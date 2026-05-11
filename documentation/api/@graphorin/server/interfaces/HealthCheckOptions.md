[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / HealthCheckOptions

# Interface: HealthCheckOptions

Defined in: packages/server/src/health/checks.ts:126

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipherpeerinstalled"></a> `cipherPeerInstalled?` | `readonly` | `boolean` | - | packages/server/src/health/checks.ts:133 |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | [`ConsolidatorDaemon`](/api/@graphorin/server/interfaces/ConsolidatorDaemon.md) | - | packages/server/src/health/checks.ts:129 |
| <a id="property-embedderloaded"></a> `embedderLoaded?` | `readonly` | `boolean` | - | packages/server/src/health/checks.ts:135 |
| <a id="property-embeddermodel"></a> `embedderModel?` | `readonly` | `string` | - | packages/server/src/health/checks.ts:134 |
| <a id="property-encryptionenabled"></a> `encryptionEnabled?` | `readonly` | `boolean` | - | packages/server/src/health/checks.ts:132 |
| <a id="property-replaybuffer"></a> `replayBuffer?` | `readonly` | [`ReplayBufferProbe`](/api/@graphorin/server/interfaces/ReplayBufferProbe.md) | - | packages/server/src/health/checks.ts:130 |
| <a id="property-secretsactive"></a> `secretsActive?` | `readonly` | `string` | - | packages/server/src/health/checks.ts:131 |
| <a id="property-store"></a> `store?` | `readonly` | [`GraphorinSqliteStore`](/api/@graphorin/store-sqlite/interfaces/GraphorinSqliteStore.md) | - | packages/server/src/health/checks.ts:127 |
| <a id="property-triggers"></a> `triggers?` | `readonly` | [`TriggersDaemon`](/api/@graphorin/server/interfaces/TriggersDaemon.md) | - | packages/server/src/health/checks.ts:128 |
| <a id="property-walwarnthresholdbytes"></a> `walWarnThresholdBytes?` | `readonly` | `number` | Highest acceptable WAL size in bytes before warning. Default 50 MB. | packages/server/src/health/checks.ts:137 |
