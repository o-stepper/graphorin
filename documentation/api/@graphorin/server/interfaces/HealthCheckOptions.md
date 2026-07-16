[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / HealthCheckOptions

# Interface: HealthCheckOptions

Defined in: [packages/server/src/health/checks.ts:164](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L164)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channels"></a> `channels?` | `readonly` | [`ChannelsDaemon`](/api/@graphorin/server/interfaces/ChannelsDaemon.md) | - | [packages/server/src/health/checks.ts:169](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L169) |
| <a id="property-cipherpeerinstalled"></a> `cipherPeerInstalled?` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:173](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L173) |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | [`ConsolidatorDaemon`](/api/@graphorin/server/interfaces/ConsolidatorDaemon.md) | - | [packages/server/src/health/checks.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L168) |
| <a id="property-embedderloaded"></a> `embedderLoaded?` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:175](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L175) |
| <a id="property-embeddermodel"></a> `embedderModel?` | `readonly` | `string` | - | [packages/server/src/health/checks.ts:174](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L174) |
| <a id="property-encryptionenabled"></a> `encryptionEnabled?` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:172](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L172) |
| <a id="property-replaybuffer"></a> `replayBuffer?` | `readonly` | [`ReplayBufferProbe`](/api/@graphorin/server/interfaces/ReplayBufferProbe.md) | - | [packages/server/src/health/checks.ts:170](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L170) |
| <a id="property-secretsactive"></a> `secretsActive?` | `readonly` | `string` | - | [packages/server/src/health/checks.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L171) |
| <a id="property-store"></a> `store?` | `readonly` | [`GraphorinSqliteStore`](/api/@graphorin/store-sqlite/interfaces/GraphorinSqliteStore.md) | - | [packages/server/src/health/checks.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L165) |
| <a id="property-triggers"></a> `triggers?` | `readonly` | [`TriggersDaemon`](/api/@graphorin/server/interfaces/TriggersDaemon.md) | - | [packages/server/src/health/checks.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L166) |
| <a id="property-walwarnthresholdbytes"></a> `walWarnThresholdBytes?` | `readonly` | `number` | Highest acceptable WAL size in bytes before warning. Default 50 MB. | [packages/server/src/health/checks.ts:177](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L177) |
| <a id="property-workflowtimers"></a> `workflowTimers?` | `readonly` | [`WorkflowTimerDaemon`](/api/@graphorin/server/interfaces/WorkflowTimerDaemon.md) | - | [packages/server/src/health/checks.ts:167](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L167) |
