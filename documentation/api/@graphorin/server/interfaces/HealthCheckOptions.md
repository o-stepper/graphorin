[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / HealthCheckOptions

# Interface: HealthCheckOptions

Defined in: [packages/server/src/health/checks.ts:157](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L157)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-channels"></a> `channels?` | `readonly` | [`ChannelsDaemon`](/api/@graphorin/server/interfaces/ChannelsDaemon.md) | - | [packages/server/src/health/checks.ts:162](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L162) |
| <a id="property-cipherpeerinstalled"></a> `cipherPeerInstalled?` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L166) |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | [`ConsolidatorDaemon`](/api/@graphorin/server/interfaces/ConsolidatorDaemon.md) | - | [packages/server/src/health/checks.ts:161](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L161) |
| <a id="property-embedderloaded"></a> `embedderLoaded?` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L168) |
| <a id="property-embeddermodel"></a> `embedderModel?` | `readonly` | `string` | - | [packages/server/src/health/checks.ts:167](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L167) |
| <a id="property-encryptionenabled"></a> `encryptionEnabled?` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L165) |
| <a id="property-replaybuffer"></a> `replayBuffer?` | `readonly` | [`ReplayBufferProbe`](/api/@graphorin/server/interfaces/ReplayBufferProbe.md) | - | [packages/server/src/health/checks.ts:163](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L163) |
| <a id="property-secretsactive"></a> `secretsActive?` | `readonly` | `string` | - | [packages/server/src/health/checks.ts:164](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L164) |
| <a id="property-store"></a> `store?` | `readonly` | [`GraphorinSqliteStore`](/api/@graphorin/store-sqlite/interfaces/GraphorinSqliteStore.md) | - | [packages/server/src/health/checks.ts:158](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L158) |
| <a id="property-triggers"></a> `triggers?` | `readonly` | [`TriggersDaemon`](/api/@graphorin/server/interfaces/TriggersDaemon.md) | - | [packages/server/src/health/checks.ts:159](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L159) |
| <a id="property-walwarnthresholdbytes"></a> `walWarnThresholdBytes?` | `readonly` | `number` | Highest acceptable WAL size in bytes before warning. Default 50 MB. | [packages/server/src/health/checks.ts:170](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L170) |
| <a id="property-workflowtimers"></a> `workflowTimers?` | `readonly` | [`WorkflowTimerDaemon`](/api/@graphorin/server/interfaces/WorkflowTimerDaemon.md) | - | [packages/server/src/health/checks.ts:160](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L160) |
