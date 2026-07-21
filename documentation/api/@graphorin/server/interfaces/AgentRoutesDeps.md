[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / AgentRoutesDeps

# Interface: AgentRoutesDeps

Defined in: packages/server/src/routes/agents.ts:37

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agents"></a> `agents` | `readonly` | [`AgentRegistry`](/api/@graphorin/server/registry/classes/AgentRegistry.md) | - | packages/server/src/routes/agents.ts:38 |
| <a id="property-dispatcher"></a> `dispatcher?` | `readonly` | [`WsDispatcher`](/api/@graphorin/server/interfaces/WsDispatcher.md) | Streaming dispatcher. When present, `POST /:id/stream` actually runs the agent and emits every event onto the `agent:<id>/runs/<runId>/events` subject. | packages/server/src/routes/agents.ts:46 |
| <a id="property-newrunid"></a> `newRunId?` | `readonly` | () => `string` | - | packages/server/src/routes/agents.ts:40 |
| <a id="property-runs"></a> `runs` | `readonly` | [`RunStateTracker`](/api/@graphorin/server/classes/RunStateTracker.md) | - | packages/server/src/routes/agents.ts:39 |
| <a id="property-suspendedruns"></a> `suspendedRuns?` | `readonly` | \{ `delete`: `Promise`\&lt;`void`\&gt;; \} | Durable suspended-run sidecar (migration 038). Writes flow through the tracker's persistence hooks; the route layer only needs the explicit DELETE on `POST /runs/:runId/abort` - the tracker's `abort()` deliberately keeps rows so a graceful-shutdown force-abort cannot erase parked approvals. | packages/server/src/routes/agents.ts:54 |
| `suspendedRuns.delete` | `public` | `Promise`\&lt;`void`\&gt; | - | packages/server/src/routes/agents.ts:54 |
