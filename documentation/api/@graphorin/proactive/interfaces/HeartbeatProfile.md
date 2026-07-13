[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / HeartbeatProfile

# Interface: HeartbeatProfile

Defined in: [packages/proactive/src/heartbeat.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L56)

The cheap isolated run profile of a beat.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budgetusd"></a> `budgetUsd?` | `readonly` | `number` | Per-beat USD ceiling (run-level budget, C5). | [packages/proactive/src/heartbeat.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L69) |
| <a id="property-isolatedsession"></a> `isolatedSession?` | `readonly` | `boolean` | Fresh session per beat (default `true`). `false` reuses the stable session id `heartbeat:<id>` so beats share memory scope. | [packages/proactive/src/heartbeat.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L61) |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | Per-beat token ceiling (run-level budget, C5). | [packages/proactive/src/heartbeat.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L71) |
| <a id="property-provider"></a> `provider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | Fail-closed model pin for every beat: the run resolves to exactly this provider and never consults the agent's fallback chain (`AgentCallOptions.pinnedProvider`). | [packages/proactive/src/heartbeat.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L67) |
