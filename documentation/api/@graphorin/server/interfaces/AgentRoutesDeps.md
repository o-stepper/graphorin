[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / AgentRoutesDeps

# Interface: AgentRoutesDeps

Defined in: [packages/server/src/routes/agents.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/agents.ts#L36)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agents"></a> `agents` | `readonly` | [`AgentRegistry`](/api/@graphorin/server/registry/classes/AgentRegistry.md) | - | [packages/server/src/routes/agents.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/agents.ts#L37) |
| <a id="property-dispatcher"></a> `dispatcher?` | `readonly` | [`WsDispatcher`](/api/@graphorin/server/interfaces/WsDispatcher.md) | Streaming dispatcher (IP-2). When present, `POST /:id/stream` actually runs the agent and emits every event onto the `agent:<id>/runs/<runId>/events` subject. | [packages/server/src/routes/agents.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/agents.ts#L45) |
| <a id="property-newrunid"></a> `newRunId?` | `readonly` | () => `string` | - | [packages/server/src/routes/agents.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/agents.ts#L39) |
| <a id="property-runs"></a> `runs` | `readonly` | [`RunStateTracker`](/api/@graphorin/server/classes/RunStateTracker.md) | - | [packages/server/src/routes/agents.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/agents.ts#L38) |
