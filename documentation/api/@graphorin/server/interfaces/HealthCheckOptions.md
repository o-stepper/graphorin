[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / HealthCheckOptions

# Interface: HealthCheckOptions

Defined in: [packages/server/src/health/checks.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L141)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipherpeerinstalled"></a> `cipherPeerInstalled?` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L149) |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | [`ConsolidatorDaemon`](/api/@graphorin/server/interfaces/ConsolidatorDaemon.md) | - | [packages/server/src/health/checks.ts:145](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L145) |
| <a id="property-embedderloaded"></a> `embedderLoaded?` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L151) |
| <a id="property-embeddermodel"></a> `embedderModel?` | `readonly` | `string` | - | [packages/server/src/health/checks.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L150) |
| <a id="property-encryptionenabled"></a> `encryptionEnabled?` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:148](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L148) |
| <a id="property-replaybuffer"></a> `replayBuffer?` | `readonly` | [`ReplayBufferProbe`](/api/@graphorin/server/interfaces/ReplayBufferProbe.md) | - | [packages/server/src/health/checks.ts:146](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L146) |
| <a id="property-secretsactive"></a> `secretsActive?` | `readonly` | `string` | - | [packages/server/src/health/checks.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L147) |
| <a id="property-store"></a> `store?` | `readonly` | [`GraphorinSqliteStore`](/api/@graphorin/store-sqlite/interfaces/GraphorinSqliteStore.md) | - | [packages/server/src/health/checks.ts:142](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L142) |
| <a id="property-triggers"></a> `triggers?` | `readonly` | [`TriggersDaemon`](/api/@graphorin/server/interfaces/TriggersDaemon.md) | - | [packages/server/src/health/checks.ts:143](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L143) |
| <a id="property-walwarnthresholdbytes"></a> `walWarnThresholdBytes?` | `readonly` | `number` | Highest acceptable WAL size in bytes before warning. Default 50 MB. | [packages/server/src/health/checks.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L153) |
| <a id="property-workflowtimers"></a> `workflowTimers?` | `readonly` | [`WorkflowTimerDaemon`](/api/@graphorin/server/interfaces/WorkflowTimerDaemon.md) | - | [packages/server/src/health/checks.ts:144](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L144) |
